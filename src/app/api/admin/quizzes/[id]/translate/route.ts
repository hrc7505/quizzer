import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { after } from "next/server";
import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { sanitizeNullBytes, stripNullBytes, sanitizeQuestionText } from "@/lib/format";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";
import { ensureQuizBatchTable } from "@/app/api/admin/generate-quiz/route";

interface QuestionTranslationInput {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

const AI_TIMEOUT_MS = 120000;
const DEFAULT_BATCH_SIZE = 6;

/**
 * Translates a single micro-batch of questions via Gemini AI.
 */
async function translateQuestionsBatchWithAi(
  questions: QuestionTranslationInput[],
  targetLangName: string,
  batchNumber: number,
  totalBatches: number
): Promise<QuestionTranslationInput[]> {
  const prompt = `You are a professional academic translator for competitive exam questions.
Translate the following ${questions.length} question(s) (Batch ${batchNumber} of ${totalBatches}) into ${targetLangName}.

CRITICAL TRANSLATION & PRESERVATION RULES:
1. When translating to Gujarati/Hindi, use formal, authentic academic terminology (e.g. "અધ્યક્ષ", "બંધારણ", "વિધાન", "કથન", "સંચાલન").
2. NEVER translate or modify programming code blocks (e.g. \`\`\`c ... \`\`\`, \`\`\`python ... \`\`\`, \`printf()\`, \`int *x\`). Keep all code exactly verbatim.
3. NEVER translate or alter mathematical formulas, variables, exponents, or LaTeX delimiters (e.g. $2^n - 1$, $\\frac{a}{b}$, $$...$$). Keep them identical.
4. For multi-statement questions, preserve the structured lines with newline (\\n) separation.
5. Translate each option and ensure \`correctAnswer\` matches one of the translated \`options\` string-for-string.
6. Translate the \`hint\` and \`description\` explanation into natural ${targetLangName}.

Questions to translate:
${JSON.stringify(questions, null, 2)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          `You are an expert multilingual exam question translator. You accurately translate question text, options, and explanations into ${targetLangName} while strictly maintaining exact LaTeX math formulas and code blocks.`,
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
            required: ["id", "text", "options", "correctAnswer", "hint", "description"],
          },
        },
        abortSignal: controller.signal,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error(`AI returned empty translation result for batch ${batchNumber}`);
    }

    return sanitizeNullBytes(JSON.parse(resultText)) as QuestionTranslationInput[];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes server background translation batches sequentially.
 */
async function processTranslateBatchesForQuiz(quizId: string, targetLanguage: string) {
  try {
    await ensureQuizBatchTable();

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { topics: { select: { id: true } } },
    });

    if (!quiz) return;

    const targetLangName =
      targetLanguage === "gu"
        ? "Gujarati (ગુજરાતી)"
        : targetLanguage === "hi"
        ? "Hindi (हिन्दी)"
        : "English";

    const pendingBatches = await prisma.quizBatch.findMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
        status: { in: ["PENDING", "PROCESSING"] },
      },
      orderBy: { batchIndex: "asc" },
    });

    for (const batch of pendingBatches) {
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
        } catch {}

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
          await prisma.quizBatch.update({
            where: { id: batch.id },
            data: { status: "COMPLETED" },
          });
          continue;
        }

        const sourceQuestions = await prisma.question.findMany({
          where: { id: { in: questionIds } },
        });

        const batchInput: QuestionTranslationInput[] = sourceQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          hint: q.hint || "",
          description: q.description || "",
        }));

        const translatedBatch = await translateQuestionsBatchWithAi(
          batchInput,
          targetLangName,
          batch.batchIndex,
          batch.totalBatches
        );

        // Delete any existing translation matching these source IDs
        await prisma.question.deleteMany({
          where: {
            quizId,
            language: targetLanguage,
            sourceQuestionId: { in: questionIds },
          },
        });

        // Insert translated records paired 1-to-1 via sourceQuestionId
        await prisma.question.createMany({
          data: translatedBatch.map((tq, idx) => {
            const origQ = sourceQuestions.find((q) => q.id === tq.id) || sourceQuestions[idx];
            return {
              quizId,
              sourceQuestionId: origQ?.id || null,
              topicId: origQ?.topicId || quiz.topics[0]?.id || "",
              language: targetLanguage,
              text: sanitizeQuestionText(tq.text),
              options: (tq.options || []).map((o) => stripNullBytes(o)),
              correctAnswer: stripNullBytes(tq.correctAnswer),
              hint: stripNullBytes(tq.hint || ""),
              description: stripNullBytes(tq.description || ""),
              imageUrl: origQ?.imageUrl || null,
              invertInDark: origQ?.invertInDark !== false,
            };
          }),
        });

        await prisma.quizBatch.update({
          where: { id: batch.id },
          data: { status: "COMPLETED", error: null },
        });

        revalidatePath("/exams");
        revalidatePath(`/admin/manage/quizzes/${quizId}/questions`);
        await revalidateQuizAndRelated(quizId);
      } catch (err: unknown) {
        console.error(`Translate batch ${batch.batchIndex} failed:`, err);
        const errResult = describeAiError(err);
        await prisma.quizBatch.update({
          where: { id: batch.id },
          data: { status: "FAILED", error: errResult.message },
        });
        break;
      }
    }

    // Check if all translation batches finished
    const unfinished = await prisma.quizBatch.count({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
        status: { not: "COMPLETED" },
      },
    });

    if (unfinished === 0) {
      setTimeout(async () => {
        try {
          await prisma.quizBatch.deleteMany({
            where: {
              topicId: quizId,
              language: targetLanguage,
              title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
            },
          });
        } catch (e) {
          console.warn("Translate batch cleanup notice:", e);
        }
      }, 5000);
    }
  } catch (error) {
    console.error("processTranslateBatchesForQuiz error:", error);
  }
}

/**
 * GET /api/admin/quizzes/[id]/translate
 * Returns quiz translation breakdown and real-time background queue status from PostgreSQL.
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureQuizBatchTable();

    const { id: quizId } = await props.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: { id: true, language: true, text: true, sourceQuestionId: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const enCount = quiz.questions.filter(
      (q) =>
        q.language === "en" ||
        (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text))
    ).length;
    const guCount = quiz.questions.filter(
      (q) => q.language === "gu" || /[\u0A80-\u0AFF]/.test(q.text)
    ).length;
    const hiCount = quiz.questions.filter(
      (q) => q.language === "hi" || /[\u0900-\u097F]/.test(q.text)
    ).length;

    const totalQuestions = Math.max(enCount, guCount, hiCount, quiz.questions.length > 0 ? 1 : 0);

    // Fetch active background translation batches
    const batches = await prisma.quizBatch.findMany({
      where: {
        topicId: quizId,
        title: { startsWith: "[TRANSLATE:" },
      },
      orderBy: { batchIndex: "asc" },
    });

    let batchQueue = null;
    if (batches.length > 0) {
      const targetLang = batches[0].language;
      const totalBatches = batches.length;
      const completedBatches = batches.filter((b) => b.status === "COMPLETED").length;
      const failedBatch = batches.find((b) => b.status === "FAILED");
      const pausedBatches = batches.filter((b) => b.status === "PAUSED");
      const activeBatch = batches.find((b) => b.status === "PROCESSING" || b.status === "PENDING");

      let queueStatus: "IDLE" | "PROCESSING" | "PAUSED" | "FAILED" | "COMPLETED" = "PROCESSING";
      if (failedBatch) queueStatus = "FAILED";
      else if (pausedBatches.length > 0 && !activeBatch) queueStatus = "PAUSED";
      else if (completedBatches === totalBatches) queueStatus = "COMPLETED";

      batchQueue = {
        targetLanguage: targetLang,
        status: queueStatus,
        totalBatches,
        completedBatches,
        currentBatch: activeBatch ? activeBatch.batchIndex : failedBatch ? failedBatch.batchIndex : totalBatches,
        processedQuestions: Math.min(completedBatches * DEFAULT_BATCH_SIZE, totalQuestions),
        totalQuestions,
        error: failedBatch?.error || null,
        failedBatchIndex: failedBatch ? failedBatch.batchIndex - 1 : null,
      };

      // Auto-recover stale batches
      if (activeBatch && activeBatch.status === "PROCESSING") {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (activeBatch.updatedAt < twoMinutesAgo) {
          after(async () => {
            await processTranslateBatchesForQuiz(quizId, targetLang);
          });
        }
      }
    }

    return NextResponse.json({
      quizId,
      totalQuestions,
      languages: {
        en: {
          count: enCount,
          percent: totalQuestions > 0 ? Math.min(100, Math.round((enCount / totalQuestions) * 100)) : 0,
        },
        gu: {
          count: guCount,
          percent: totalQuestions > 0 ? Math.min(100, Math.round((guCount / totalQuestions) * 100)) : 0,
        },
        hi: {
          count: hiCount,
          percent: totalQuestions > 0 ? Math.min(100, Math.round((hiCount / totalQuestions) * 100)) : 0,
        },
      },
      batchQueue,
    });
  } catch (error) {
    console.error("Failed to fetch translation status:", error);
    return NextResponse.json({ error: "Failed to fetch translation status" }, { status: 500 });
  }
}

/**
 * POST /api/admin/quizzes/[id]/translate
 * Manages server background translation batches (start, pause, resume, restart, cancel).
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureQuizBatchTable();

    const { id: quizId } = await props.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";
    const targetLanguage = stripNullBytes(body.targetLanguage || "gu");
    const batchSize = Math.max(1, Math.min(25, body.batchSize || DEFAULT_BATCH_SIZE));

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        topics: { select: { id: true } },
        questions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Source questions (select base canonical questions where sourceQuestionId is null)
    let sourceQuestions = quiz.questions.filter((q) => !q.sourceQuestionId);
    if (sourceQuestions.length === 0) {
      sourceQuestions = quiz.questions.filter((q) => q.language !== targetLanguage);
    }
    if (sourceQuestions.length === 0) {
      const enQuestions = quiz.questions.filter((q) => q.language === "en");
      sourceQuestions = enQuestions.length > 0 ? enQuestions : quiz.questions;
    }

    if (sourceQuestions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions to translate" }, { status: 400 });
    }

    // ACTION: PAUSE
    if (action === "pause") {
      await prisma.quizBatch.updateMany({
        where: {
          topicId: quizId,
          language: targetLanguage,
          title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: { status: "PAUSED" },
      });
      return NextResponse.json({ success: true, message: "Paused translation queue." });
    }

    // ACTION: RESUME
    if (action === "resume") {
      await prisma.quizBatch.updateMany({
        where: {
          topicId: quizId,
          language: targetLanguage,
          title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
          status: { in: ["PAUSED", "FAILED"] },
        },
        data: { status: "PENDING", error: null },
      });

      after(async () => {
        await processTranslateBatchesForQuiz(quizId, targetLanguage);
      });

      return NextResponse.json({ success: true, message: "Resumed translation queue." });
    }

    // ACTION: CANCEL OR RESTART
    if (action === "cancel" || action === "restart") {
      await prisma.quizBatch.deleteMany({
        where: {
          topicId: quizId,
          language: targetLanguage,
          title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
        },
      });
      if (action === "cancel") {
        return NextResponse.json({ success: true, message: "Cancelled translation queue." });
      }
    }

    // ACTION: START / CREATE BATCHES IN DATABASE
    await prisma.quizBatch.deleteMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: `[TRANSLATE:${targetLanguage}]` },
      },
    });

    // If fresh start, remove previously translated questions for target language
    if (body.resume !== true) {
      await prisma.question.deleteMany({
        where: {
          quizId,
          language: targetLanguage,
        },
      });
    }

    const bunches: string[][] = [];
    for (let i = 0; i < sourceQuestions.length; i += batchSize) {
      bunches.push(sourceQuestions.slice(i, i + batchSize).map((q) => q.id));
    }

    const totalBatches = bunches.length;

    await Promise.all(
      bunches.map((bunch, idx) =>
        prisma.quizBatch.create({
          data: {
            topicId: quizId,
            title: `[TRANSLATE:${targetLanguage}] ${quiz.title}`,
            language: targetLanguage,
            difficulty: "Medium",
            rawText: JSON.stringify(bunch),
            batchIndex: idx + 1,
            totalBatches,
            status: "PENDING",
          },
        })
      )
    );

    after(async () => {
      await processTranslateBatchesForQuiz(quizId, targetLanguage);
    });

    return NextResponse.json({
      success: true,
      isBatched: true,
      quizId,
      targetLanguage,
      totalBatches,
      totalQuestions: sourceQuestions.length,
      message: `Started background translation into ${targetLanguage}.`,
    });
  } catch (err) {
    console.error("Quiz translation error:", err);
    const { message } = describeAiError(err);
    return NextResponse.json({ error: message || "Failed to translate quiz" }, { status: 500 });
  }
}
