import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Type } from "@google/genai";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { sanitizeNullBytes, stripNullBytes, sanitizeQuestionText } from "@/lib/format";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

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

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await props.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: { language: true, text: true },
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
    });
  } catch (error) {
    console.error("Failed to fetch translation status:", error);
    return NextResponse.json({ error: "Failed to fetch translation status" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await props.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full"; // "init" | "batch" | "complete" | "full"
    const targetLanguage = stripNullBytes(body.targetLanguage || "gu");
    const batchSize = Math.max(1, Math.min(25, body.batchSize || DEFAULT_BATCH_SIZE));

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        topics: { select: { id: true } },
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Identify the source questions to translate (prefer English questions, or the primary language)
    let sourceQuestions = quiz.questions.filter((q) => q.language !== targetLanguage);
    if (sourceQuestions.length === 0) {
      // If all questions are already in targetLanguage or none, take all questions
      sourceQuestions = quiz.questions;
    } else {
      // If we have English questions, prioritize translating from English
      const enQuestions = sourceQuestions.filter((q) => q.language === "en");
      if (enQuestions.length > 0) {
        sourceQuestions = enQuestions;
      }
    }

    if (sourceQuestions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions to translate" }, { status: 400 });
    }

    if (!ai) {
      return NextResponse.json({ error: "AI service is not configured" }, { status: 500 });
    }

    const targetLangName =
      targetLanguage === "gu"
        ? "Gujarati (ગુજરાતી)"
        : targetLanguage === "hi"
        ? "Hindi (हिन्दी)"
        : "English";

    // STEP 1: INITIALIZE BATCH TRANSLATION SESSION
    if (action === "init") {
      const resume = body.resume === true;
      const existingTargetQuestions = quiz.questions.filter((q) => q.language === targetLanguage);

      if (!resume) {
        // If fresh start requested, clean up any existing questions in targetLanguage
        await prisma.question.deleteMany({
          where: {
            quizId,
            language: targetLanguage,
          },
        });
      }

      const totalBatches = Math.ceil(sourceQuestions.length / batchSize);
      const startBatch =
        resume && existingTargetQuestions.length > 0
          ? Math.floor(existingTargetQuestions.length / batchSize)
          : 0;

      return NextResponse.json({
        success: true,
        action: "init",
        targetQuizId: quizId,
        targetQuizTitle: quiz.title,
        totalQuestions: sourceQuestions.length,
        existingCount: resume ? existingTargetQuestions.length : 0,
        startBatch,
        batchSize,
        totalBatches,
      });
    }

    // STEP 2: PROCESS A SINGLE BATCH OF QUESTIONS
    if (action === "batch") {
      const batchIndex = typeof body.batchIndex === "number" ? body.batchIndex : 0;
      const startIndex = batchIndex * batchSize;
      const slice = sourceQuestions.slice(startIndex, startIndex + batchSize);

      if (slice.length === 0) {
        return NextResponse.json({
          success: true,
          batchIndex,
          totalBatches: Math.ceil(sourceQuestions.length / batchSize),
          translatedCount: 0,
          done: true,
        });
      }

      const batchInput: QuestionTranslationInput[] = slice.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        hint: q.hint || "",
        description: q.description || "",
      }));

      const totalBatches = Math.ceil(sourceQuestions.length / batchSize);
      const translatedBatch = await translateQuestionsBatchWithAi(
        batchInput,
        targetLangName,
        batchIndex + 1,
        totalBatches
      );

      // Save translated questions directly into this same quiz with language = targetLanguage
      await prisma.question.createMany({
        data: translatedBatch.map((tq, idx) => {
          const origQ = slice.find((q) => q.id === tq.id) || slice[idx];
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

      return NextResponse.json({
        success: true,
        batchIndex,
        totalBatches,
        translatedCount: translatedBatch.length,
        processedTotal: Math.min(startIndex + slice.length, sourceQuestions.length),
        totalQuestions: sourceQuestions.length,
      });
    }

    // STEP 3: FINALIZE / COMPLETE BATCH TRANSLATION
    if (action === "complete") {
      await revalidateQuizAndRelated(quizId);

      return NextResponse.json({
        success: true,
        action: "complete",
        quizId,
        language: targetLanguage,
        message: `Successfully translated and saved all ${sourceQuestions.length} questions into ${targetLangName} under "${quiz.title}".`,
      });
    }

    // FALLBACK: ALL-IN-ONE BATCH LOOP
    const questionsData: QuestionTranslationInput[] = sourceQuestions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      hint: q.hint || "",
      description: q.description || "",
    }));

    const totalBatches = Math.ceil(questionsData.length / batchSize);
    const allTranslated: QuestionTranslationInput[] = [];

    for (let b = 0; b < totalBatches; b++) {
      const batchSlice = questionsData.slice(b * batchSize, (b + 1) * batchSize);
      const translatedSlice = await translateQuestionsBatchWithAi(
        batchSlice,
        targetLangName,
        b + 1,
        totalBatches
      );
      allTranslated.push(...translatedSlice);
    }

    // Clean up existing target language questions before inserting new ones
    await prisma.question.deleteMany({
      where: {
        quizId,
        language: targetLanguage,
      },
    });

    await prisma.question.createMany({
      data: allTranslated.map((tq, idx) => {
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

    await revalidateQuizAndRelated(quizId);

    return NextResponse.json({
      success: true,
      quizId,
      title: quiz.title,
      language: targetLanguage,
      message: `Successfully translated ${allTranslated.length} questions into ${targetLangName}`,
    });
  } catch (err) {
    console.error("Quiz translation error:", err);
    const { message } = describeAiError(err);
    return NextResponse.json({ error: message || "Failed to translate quiz" }, { status: 500 });
  }
}
