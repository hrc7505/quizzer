import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Type } from "@google/genai";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { stripNullBytes, sanitizeNullBytes, sanitizeQuestionText } from "@/lib/format";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";
import { ensureQuizBatchTable } from "@/app/api/admin/generate-quiz/route";

interface ProofreadQuestion {
  id?: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

const AI_TIMEOUT_MS = 60000;
const BATCH_SIZE = 8;

/**
 * Proofreads and repairs multilingual question data via Gemini AI.
 */
async function proofreadQuestionsWithAi(
  questions: ProofreadQuestion[]
): Promise<ProofreadQuestion[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const prompt = `You are an expert multilingual academic editor and language proofreader for competitive exam question banks (supporting Gujarati, Hindi, and English).

Proofread and fix language rendering, OCR corruption, grammatical issues, and typographical errors for the ${questions.length} question(s) below in their respective language.

CRITICAL PRESERVATION & PROOFREADING RULES:
1. For Gujarati text: Fix broken Unicode conjunct characters (જોડાક્ષરો), improper halant/virama rendering, and spelling typos without changing authentic exam terms.
2. For Hindi text: Fix broken Devanagari ligatures, matra placements, anusvara/chandrabindu, and spelling errors while maintaining pure academic vocabulary.
3. For English text: Fix spelling, grammatical agreement, and capitalization.
4. NEVER modify, translate, or alter programming code snippets (e.g. \`\`\`c ... \`\`\`, \`printf()\`, \`int *x\`). Keep all code exactly verbatim.
5. NEVER alter mathematical formulas, scientific notation, or LaTeX delimiters (e.g. $2^n - 1$, $\\frac{a}{b}$, $$...$$). Keep them identical.
6. PRESERVE question structure: For multi-statement questions (1., 2., 3. or (i), (ii), (iii)), format the premise and numbered statements with clean newline separation (\\n).
7. Extract exactly 4 clean options without letter prefixes like (A), (B).
8. The \`correctAnswer\` MUST match one of the 4 \`options\` EXACTLY string-for-string.
9. Provide or improve the \`hint\` and \`description\` explanation in the same language.

Questions to proofread:
${JSON.stringify(questions, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "You are a meticulous multilingual proofreader for Gujarati, Hindi, and English. You fix OCR artifacts, broken conjunct characters (જોડાક્ષર/देवनागरी संयुक्त वर्ण), and spelling mistakes while strictly preserving LaTeX math, programming code, and original terminology.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              hint: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["text", "options", "correctAnswer", "hint", "description"],
          },
        },
        abortSignal: controller.signal,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI model.");
    }

    const parsed = sanitizeNullBytes(JSON.parse(resultText)) as ProofreadQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes pending proofreading batches on the server sequentially.
 */
async function processProofreadBatchesForQuiz(quizId: string, language: string) {
  try {
    await ensureQuizBatchTable();

    const pendingBatches = await prisma.quizBatch.findMany({
      where: {
        topicId: quizId,
        language,
        title: { startsWith: `[PROOFREAD:${language}]` },
        status: { in: ["PENDING", "PROCESSING"] },
      },
      orderBy: { batchIndex: "asc" },
    });

    for (const batch of pendingBatches) {
      // Re-fetch batch status in case paused or cancelled
      const fresh = await prisma.quizBatch.findUnique({ where: { id: batch.id } });
      if (!fresh || fresh.status === "PAUSED" || fresh.status === "COMPLETED") {
        continue;
      }

      await prisma.quizBatch.update({
        where: { id: batch.id },
        data: { status: "PROCESSING", error: null },
      });

      try {
        let questionIds: string[] = [];
        try {
          questionIds = JSON.parse(batch.rawText);
        } catch {
          // Fallback if rawText is not JSON
        }

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
          await prisma.quizBatch.update({
            where: { id: batch.id },
            data: { status: "COMPLETED" },
          });
          continue;
        }

        const questions = await prisma.question.findMany({
          where: { id: { in: questionIds } },
        });

        const batchInput: ProofreadQuestion[] = questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          hint: q.hint,
          description: q.description,
        }));

        const fixedBatch = await proofreadQuestionsWithAi(batchInput);

        for (const fixed of fixedBatch) {
          if (!fixed.id) continue;
          await prisma.question.update({
            where: { id: fixed.id },
            data: {
              text: sanitizeQuestionText(fixed.text),
              options: fixed.options.map(stripNullBytes),
              correctAnswer: stripNullBytes(fixed.correctAnswer),
              hint: stripNullBytes(fixed.hint),
              description: stripNullBytes(fixed.description),
            },
          });
        }

        await prisma.quizBatch.update({
          where: { id: batch.id },
          data: { status: "COMPLETED", error: null },
        });

        revalidatePath("/exams");
        revalidatePath(`/admin/manage/quizzes/${quizId}/questions`);
        await revalidateQuizAndRelated(quizId);
      } catch (err: unknown) {
        console.error(`Proofread batch ${batch.batchIndex} failed:`, err);
        const errResult = describeAiError(err);
        await prisma.quizBatch.update({
          where: { id: batch.id },
          data: { status: "FAILED", error: errResult.message },
        });
        // Stop sequential execution on error
        break;
      }
    }

    // Check if all batches reached completion; if so, schedule automatic cleanup from DB
    const unfinished = await prisma.quizBatch.count({
      where: {
        topicId: quizId,
        language,
        title: { startsWith: `[PROOFREAD:${language}]` },
        status: { not: "COMPLETED" },
      },
    });

    if (unfinished === 0) {
      // Delay cleanup by 5 seconds so any open client UI reads the 100% completion state
      setTimeout(async () => {
        try {
          await prisma.quizBatch.deleteMany({
            where: {
              topicId: quizId,
              language,
              title: { startsWith: `[PROOFREAD:${language}]` },
            },
          });
        } catch (e) {
          console.warn("Proofread batch cleanup notice:", e);
        }
      }, 5000);
    }
  } catch (error) {
    console.error("processProofreadBatchesForQuiz error:", error);
  }
}

/**
 * GET /api/admin/questions/fix-language?quizId=...&language=...
 * Returns real-time server database batch status across devices.
 */
export async function GET(req: Request) {
  try {
    await ensureQuizBatchTable();

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    const language = searchParams.get("language") || "en";

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: { id: true, language: true, text: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const targetQuestions = quiz.questions.filter((q) => {
      if (language === "en") {
        return q.language === "en" || (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text));
      }
      if (language === "gu") {
        return q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text));
      }
      if (language === "hi") {
        return q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text));
      }
      return true;
    });

    const batches = await prisma.quizBatch.findMany({
      where: {
        topicId: quizId,
        language,
        title: { startsWith: `[PROOFREAD:${language}]` },
      },
      orderBy: { batchIndex: "asc" },
    });

    if (batches.length === 0) {
      return NextResponse.json({
        success: true,
        status: "IDLE",
        quizId,
        language,
        totalQuestions: targetQuestions.length,
        totalBatches: Math.ceil(targetQuestions.length / BATCH_SIZE),
        completedBatches: 0,
        processedQuestions: 0,
        error: null,
      });
    }

    const totalBatches = batches.length;
    const completedBatches = batches.filter((b) => b.status === "COMPLETED").length;
    const failedBatch = batches.find((b) => b.status === "FAILED");
    const pausedBatches = batches.filter((b) => b.status === "PAUSED");
    const activeBatch = batches.find((b) => b.status === "PROCESSING" || b.status === "PENDING");

    let status: "IDLE" | "PROCESSING" | "PAUSED" | "FAILED" | "COMPLETED" = "PROCESSING";

    if (failedBatch) {
      status = "FAILED";
    } else if (pausedBatches.length > 0 && !activeBatch) {
      status = "PAUSED";
    } else if (completedBatches === totalBatches) {
      status = "COMPLETED";
    } else if (activeBatch) {
      status = "PROCESSING";
    }

    // Auto-recover stale batches older than 2 minutes
    if (activeBatch && activeBatch.status === "PROCESSING") {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (activeBatch.updatedAt < twoMinutesAgo) {
        // Kick off background processor again
        after(async () => {
          await processProofreadBatchesForQuiz(quizId, language);
        });
      }
    }

    const processedQuestions = Math.min(completedBatches * BATCH_SIZE, targetQuestions.length);

    return NextResponse.json({
      success: true,
      status,
      quizId,
      language,
      totalQuestions: targetQuestions.length,
      totalBatches,
      currentBatch: activeBatch ? activeBatch.batchIndex : failedBatch ? failedBatch.batchIndex : totalBatches,
      completedBatches,
      processedQuestions,
      error: failedBatch?.error || null,
      failedBatchIndex: failedBatch ? failedBatch.batchIndex - 1 : null,
    });
  } catch (error) {
    console.error("GET /api/admin/questions/fix-language error:", error);
    return NextResponse.json({ error: "Failed to get proofreading status" }, { status: 500 });
  }
}

/**
 * POST /api/admin/questions/fix-language
 * Handles background server batch management (start, pause, resume, cancel)
 * as well as single-question proofreading.
 */
export async function POST(req: Request) {
  try {
    await ensureQuizBatchTable();

    const body = await req.json();
    const { question, questionId, quizId, language = "en", action = "start" } = body;

    // Case 1: In-memory single question
    if (question && !quizId && !questionId) {
      const sanitizedInput: ProofreadQuestion = {
        id: question.id || "temp",
        text: sanitizeQuestionText(question.text || ""),
        options: Array.isArray(question.options) ? question.options.map((o: string) => stripNullBytes(String(o))) : [],
        correctAnswer: stripNullBytes(question.correctAnswer || ""),
        hint: stripNullBytes(question.hint || ""),
        description: stripNullBytes(question.description || ""),
      };

      const fixedList = await proofreadQuestionsWithAi([sanitizedInput]);
      return NextResponse.json({ success: true, question: fixedList[0] || sanitizedInput });
    }

    // Case 2: Single question by ID
    if (questionId) {
      const existing = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!existing) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }

      const fixedList = await proofreadQuestionsWithAi([
        {
          id: existing.id,
          text: existing.text,
          options: existing.options,
          correctAnswer: existing.correctAnswer,
          hint: existing.hint,
          description: existing.description,
        },
      ]);

      const fixed = fixedList[0];
      if (!fixed) {
        return NextResponse.json({ error: "AI proofreading failed to produce result" }, { status: 500 });
      }

      const updated = await prisma.question.update({
        where: { id: questionId },
        data: {
          text: sanitizeQuestionText(fixed.text),
          options: fixed.options.map(stripNullBytes),
          correctAnswer: stripNullBytes(fixed.correctAnswer),
          hint: stripNullBytes(fixed.hint),
          description: stripNullBytes(fixed.description),
        },
      });

      if (existing.quizId) {
        await revalidateQuizAndRelated(existing.quizId);
      }

      return NextResponse.json({ success: true, question: updated });
    }

    // Case 3: Server-side Database Batch Execution for Quiz
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            select: { id: true, language: true, text: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      const targetQuestions = quiz.questions.filter((q) => {
        if (language === "en") {
          return q.language === "en" || (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text));
        }
        if (language === "gu") {
          return q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text));
        }
        if (language === "hi") {
          return q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text));
        }
        return true;
      });

      if (targetQuestions.length === 0) {
        return NextResponse.json({
          success: true,
          totalQuestions: 0,
          message: `Quiz has no ${language.toUpperCase()} questions to proofread.`,
        });
      }

      // ACTION: PAUSE
      if (action === "pause") {
        await prisma.quizBatch.updateMany({
          where: {
            topicId: quizId,
            language,
            title: { startsWith: `[PROOFREAD:${language}]` },
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: { status: "PAUSED" },
        });
        return NextResponse.json({ success: true, message: "Paused server proofreading batches." });
      }

      // ACTION: RESUME
      if (action === "resume") {
        await prisma.quizBatch.updateMany({
          where: {
            topicId: quizId,
            language,
            title: { startsWith: `[PROOFREAD:${language}]` },
            status: { in: ["PAUSED", "FAILED"] },
          },
          data: { status: "PENDING", error: null },
        });

        after(async () => {
          await processProofreadBatchesForQuiz(quizId, language);
        });

        return NextResponse.json({ success: true, message: "Resumed server proofreading batches." });
      }

      // ACTION: CANCEL OR RESTART (Deletes existing batch queue for this quiz)
      if (action === "cancel" || action === "restart") {
        await prisma.quizBatch.deleteMany({
          where: {
            topicId: quizId,
            language,
            title: { startsWith: `[PROOFREAD:${language}]` },
          },
        });
        if (action === "cancel") {
          return NextResponse.json({ success: true, message: "Cancelled server proofreading batches." });
        }
      }

      // ACTION: START / CREATE BATCHES IN DATABASE
      // Clean up previous batch records for this quiz & language
      await prisma.quizBatch.deleteMany({
        where: {
          topicId: quizId,
          language,
          title: { startsWith: `[PROOFREAD:${language}]` },
        },
      });

      const bunches: string[][] = [];
      for (let i = 0; i < targetQuestions.length; i += BATCH_SIZE) {
        bunches.push(targetQuestions.slice(i, i + BATCH_SIZE).map((q) => q.id));
      }

      const totalBatches = bunches.length;

      // 1. Create persistent QuizBatch records in PostgreSQL
      await Promise.all(
        bunches.map((bunch, idx) =>
          prisma.quizBatch.create({
            data: {
              topicId: quizId,
              title: `[PROOFREAD:${language}] ${quiz.title}`,
              language,
              difficulty: "Medium",
              rawText: JSON.stringify(bunch),
              batchIndex: idx + 1,
              totalBatches,
              status: "PENDING",
            },
          })
        )
      );

      // 2. Start server-side asynchronous execution in background via after()
      after(async () => {
        await processProofreadBatchesForQuiz(quizId, language);
      });

      return NextResponse.json({
        success: true,
        isBatched: true,
        quizId,
        language,
        totalBatches,
        totalQuestions: targetQuestions.length,
        message: `Created ${totalBatches} background batches. Processing on server.`,
      });
    }

    return NextResponse.json({ error: "Invalid request. Provide question, questionId, or quizId." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/questions/fix-language error:", error);
    const errResult = describeAiError(error);
    return NextResponse.json({ error: errResult.message }, { status: 500 });
  }
}
