import { Type } from "@google/genai";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { sanitizeNullBytes, stripNullBytes, sanitizeQuestionText } from "@/lib/format";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";
import { ensureQuizBatchTable } from "@/app/api/admin/generate-quiz/route";
import {
  ServerBatchQueue,
  BatchQueueStatus,
  BatchAction,
  buildTranslateBatchPrefix,
  buildTranslateBatchTitle,
} from "@/types/batch";
import { getLanguagePromptName } from "@/types/language";

export type { ServerBatchQueue, BatchQueueStatus };

/**
 * Question input representation for batch translation.
 */
export interface QuestionTranslationInput {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

/**
 * Translation completion stats for a language.
 */
export interface LangStatus {
  count: number;
  percent: number;
}

/**
 * Overall translation status breakdown across all tracks for a quiz.
 */
export interface QuizTranslateStatus {
  quizId: string;
  totalQuestions: number;
  languages: {
    en: LangStatus;
    gu: LangStatus;
    hi: LangStatus;
    [key: string]: LangStatus;
  };
  batchQueue?: ServerBatchQueue | null;
  batchQueues?: Record<string, ServerBatchQueue>;
}

export const AI_TIMEOUT_MS = 120000;
export const DEFAULT_BATCH_SIZE = 6;

/**
 * Builds the academic translation prompt for Gemini AI.
 */
export function buildAcademicTranslationPrompt(
  questions: QuestionTranslationInput[],
  targetLangName: string,
  batchNumber: number,
  totalBatches: number
): string {
  return `You are a professional academic translator for competitive exam questions.
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
}

/**
 * Translates a single micro-batch of questions via Gemini AI.
 *
 * @param questions List of questions to translate.
 * @param targetLangName Target language display name.
 * @param batchNumber Current batch index (1-based).
 * @param totalBatches Total count of batches in queue.
 * @returns Translated question objects.
 */
export async function translateQuestionsBatchWithAi(
  questions: QuestionTranslationInput[],
  targetLangName: string,
  batchNumber: number,
  totalBatches: number
): Promise<QuestionTranslationInput[]> {
  const prompt = buildAcademicTranslationPrompt(questions, targetLangName, batchNumber, totalBatches);

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
 * Executes server background translation batches sequentially for a specific quiz and target language.
 * Uses atomic status claiming to prevent duplicate execution across concurrent requests.
 *
 * @param quizId ID of the target quiz.
 * @param targetLanguage Target language code (e.g., 'gu', 'hi').
 */
export async function processTranslateBatchesForQuiz(quizId: string, targetLanguage: string): Promise<void> {
  try {
    await ensureQuizBatchTable();

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { topics: { select: { id: true } } },
    });

    if (!quiz) return;

    const targetLangName = getLanguagePromptName(targetLanguage);
    const batchPrefix = buildTranslateBatchPrefix(targetLanguage);

    const pendingBatches = await prisma.quizBatch.findMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: batchPrefix },
        status: { in: [BatchQueueStatus.PENDING, BatchQueueStatus.PROCESSING] },
      },
      orderBy: { batchIndex: "asc" },
    });

    for (const batch of pendingBatches) {
      // Atomically claim the batch to avoid race conditions with multiple workers
      const claimResult = await prisma.quizBatch.updateMany({
        where: {
          id: batch.id,
          status: { in: [BatchQueueStatus.PENDING, BatchQueueStatus.FAILED] },
        },
        data: {
          status: BatchQueueStatus.PROCESSING,
          error: null,
          updatedAt: new Date(),
        },
      });

      // If another worker already claimed it or status is PAUSED / COMPLETED, skip it
      if (claimResult.count === 0) {
        const fresh = await prisma.quizBatch.findUnique({ where: { id: batch.id } });
        // Allow resuming if it's stuck in processing for > 2 mins
        if (
          fresh &&
          fresh.status === BatchQueueStatus.PROCESSING &&
          fresh.updatedAt < new Date(Date.now() - 2 * 60 * 1000)
        ) {
          await prisma.quizBatch.update({
            where: { id: batch.id },
            data: { updatedAt: new Date(), error: null },
          });
        } else {
          continue;
        }
      }

      try {
        let questionIds: string[] = [];
        try {
          questionIds = JSON.parse(batch.rawText);
        } catch {}

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
          await prisma.quizBatch.update({
            where: { id: batch.id },
            data: { status: BatchQueueStatus.COMPLETED },
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

        // Delete any existing translation matching these source IDs for this language
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
          data: { status: BatchQueueStatus.COMPLETED, error: null },
        });

        revalidatePath("/exams");
        revalidatePath(`/admin/manage/quizzes/${quizId}/questions`);
        await revalidateQuizAndRelated(quizId);
      } catch (err: unknown) {
        console.error(`Translate batch ${batch.batchIndex} for ${targetLanguage} failed:`, err);
        const errResult = describeAiError(err);
        await prisma.quizBatch.update({
          where: { id: batch.id },
          data: { status: BatchQueueStatus.FAILED, error: errResult.message },
        });
        break;
      }
    }

    // Check if all translation batches finished for this language
    const unfinished = await prisma.quizBatch.count({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: batchPrefix },
        status: { not: BatchQueueStatus.COMPLETED },
      },
    });

    if (unfinished === 0) {
      const completedBatchIds = pendingBatches.map((b) => b.id);
      setTimeout(async () => {
        try {
          await prisma.quizBatch.deleteMany({
            where: {
              id: { in: completedBatchIds },
              status: BatchQueueStatus.COMPLETED,
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
 * Retrieves the translation status and background queues for a quiz.
 *
 * @param quizId Target quiz ID.
 * @param requestedTargetLang Optional specific target language to filter batchQueue for.
 * @returns Comprehensive quiz translation status breakdown.
 */
export async function getQuizTranslationStatus(
  quizId: string,
  requestedTargetLang?: string | null
): Promise<{ status?: QuizTranslateStatus; error?: string; statusCode?: number; staleActiveBatchLang?: string | null }> {
  await ensureQuizBatchTable();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        select: { id: true, language: true, text: true, sourceQuestionId: true },
      },
    },
  });

  if (!quiz) {
    return { error: "Quiz not found", statusCode: 404 };
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

  const baseCount = quiz.questions.filter((q) => !q.sourceQuestionId).length;
  const totalQuestions = Math.max(
    baseCount,
    enCount,
    guCount,
    hiCount,
    quiz.questions.length > 0 ? 1 : 0
  );

  // Fetch active background translation batches for THIS quiz
  const batches = await prisma.quizBatch.findMany({
    where: {
      topicId: quizId,
      title: { startsWith: buildTranslateBatchPrefix() },
    },
    orderBy: { batchIndex: "asc" },
  });

  // Group batches strictly by target language
  const batchesByLang: Record<string, typeof batches> = {};
  for (const b of batches) {
    const lang = b.language || "gu";
    if (!batchesByLang[lang]) batchesByLang[lang] = [];
    batchesByLang[lang].push(b);
  }

  const batchQueues: Record<string, ServerBatchQueue> = {};
  let staleActiveBatchLang: string | null = null;

  for (const [lang, langBatches] of Object.entries(batchesByLang)) {
    const totalBatches = langBatches.length;
    const completedBatches = langBatches.filter((b) => b.status === BatchQueueStatus.COMPLETED).length;
    const failedBatch = langBatches.find((b) => b.status === BatchQueueStatus.FAILED);
    const pausedBatches = langBatches.filter((b) => b.status === BatchQueueStatus.PAUSED);
    const activeBatch = langBatches.find(
      (b) => b.status === BatchQueueStatus.PROCESSING || b.status === BatchQueueStatus.PENDING
    );

    let queueStatus: BatchQueueStatus = BatchQueueStatus.PROCESSING;
    if (failedBatch) queueStatus = BatchQueueStatus.FAILED;
    else if (pausedBatches.length > 0 && !activeBatch) queueStatus = BatchQueueStatus.PAUSED;
    else if (completedBatches === totalBatches && totalBatches > 0) queueStatus = BatchQueueStatus.COMPLETED;

    batchQueues[lang] = {
      targetLanguage: lang,
      status: queueStatus,
      totalBatches,
      completedBatches,
      currentBatch: activeBatch ? activeBatch.batchIndex : failedBatch ? failedBatch.batchIndex : totalBatches,
      processedQuestions: Math.min(completedBatches * DEFAULT_BATCH_SIZE, totalQuestions),
      totalQuestions,
      error: failedBatch?.error || null,
      failedBatchIndex: failedBatch ? failedBatch.batchIndex - 1 : null,
    };

    if (activeBatch && activeBatch.status === BatchQueueStatus.PROCESSING) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (activeBatch.updatedAt < twoMinutesAgo) {
        staleActiveBatchLang = lang;
      }
    }
  }

  let batchQueue: ServerBatchQueue | null = null;
  if (requestedTargetLang && batchQueues[requestedTargetLang]) {
    batchQueue = batchQueues[requestedTargetLang];
  } else if (requestedTargetLang) {
    batchQueue = null;
  } else {
    const activeEntry = Object.values(batchQueues).find(
      (q) =>
        q.status === BatchQueueStatus.PROCESSING ||
        q.status === BatchQueueStatus.FAILED ||
        q.status === BatchQueueStatus.PAUSED
    );
    batchQueue = activeEntry || Object.values(batchQueues)[0] || null;
  }

  return {
    status: {
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
      batchQueues,
    },
    staleActiveBatchLang,
  };
}

/**
 * Executes a queue management action (start, pause, resume, cancel, restart) for a specific target language.
 */
export async function manageQuizTranslationQueue(params: {
  quizId: string;
  action: BatchAction | "start" | "pause" | "resume" | "cancel" | "restart";
  targetLanguage: string;
  resume?: boolean;
  batchSize?: number;
}): Promise<{
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  isBatched?: boolean;
  totalBatches?: number;
  totalQuestions?: number;
  shouldTriggerWorker?: boolean;
}> {
  const { quizId, action, targetLanguage, resume, batchSize = DEFAULT_BATCH_SIZE } = params;
  await ensureQuizBatchTable();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: { select: { id: true } },
      questions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quiz) {
    return { error: "Quiz not found", statusCode: 404 };
  }

  const batchPrefix = buildTranslateBatchPrefix(targetLanguage);

  // ACTION: PAUSE
  if (action === BatchAction.PAUSE) {
    await prisma.quizBatch.updateMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: batchPrefix },
        status: { in: [BatchQueueStatus.PENDING, BatchQueueStatus.PROCESSING] },
      },
      data: { status: BatchQueueStatus.PAUSED },
    });
    return { success: true, message: `Paused ${targetLanguage.toUpperCase()} translation queue.` };
  }

  // ACTION: RESUME
  if (action === BatchAction.RESUME) {
    await prisma.quizBatch.updateMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: batchPrefix },
        status: { in: [BatchQueueStatus.PAUSED, BatchQueueStatus.FAILED] },
      },
      data: { status: BatchQueueStatus.PENDING, error: null },
    });

    return {
      success: true,
      message: `Resumed ${targetLanguage.toUpperCase()} translation queue.`,
      shouldTriggerWorker: true,
    };
  }

  // ACTION: CANCEL OR RESTART
  if (action === BatchAction.CANCEL || action === BatchAction.RESTART) {
    await prisma.quizBatch.deleteMany({
      where: {
        topicId: quizId,
        language: targetLanguage,
        title: { startsWith: batchPrefix },
      },
    });
    if (action === BatchAction.CANCEL) {
      return { success: true, message: `Cancelled ${targetLanguage.toUpperCase()} translation queue.` };
    }
  }

  // ACTION: START / CREATE BATCHES IN DATABASE
  let sourceQuestions = quiz.questions.filter((q) => !q.sourceQuestionId);
  if (sourceQuestions.length === 0) {
    sourceQuestions = quiz.questions.filter((q) => q.language !== targetLanguage);
  }
  if (sourceQuestions.length === 0) {
    const enQuestions = quiz.questions.filter((q) => q.language === "en");
    sourceQuestions = enQuestions.length > 0 ? enQuestions : quiz.questions;
  }

  if (sourceQuestions.length === 0) {
    return { error: "Quiz has no questions to translate", statusCode: 400 };
  }

  await prisma.quizBatch.deleteMany({
    where: {
      topicId: quizId,
      language: targetLanguage,
      title: { startsWith: batchPrefix },
    },
  });

  if (resume !== true) {
    await prisma.question.deleteMany({
      where: {
        quizId,
        language: targetLanguage,
      },
    });
  }

  const effectiveBatchSize = Math.max(1, Math.min(25, batchSize));
  const bunches: string[][] = [];
  for (let i = 0; i < sourceQuestions.length; i += effectiveBatchSize) {
    bunches.push(sourceQuestions.slice(i, i + effectiveBatchSize).map((q) => q.id));
  }

  const totalBatches = bunches.length;

  await Promise.all(
    bunches.map((bunch, idx) =>
      prisma.quizBatch.create({
        data: {
          topicId: quizId,
          title: buildTranslateBatchTitle(targetLanguage, quiz.title),
          language: targetLanguage,
          difficulty: "Medium",
          rawText: JSON.stringify(bunch),
          batchIndex: idx + 1,
          totalBatches,
          status: BatchQueueStatus.PENDING,
        },
      })
    )
  );

  return {
    success: true,
    isBatched: true,
    totalBatches,
    totalQuestions: sourceQuestions.length,
    message: `Started background translation into ${targetLanguage}.`,
    shouldTriggerWorker: true,
  };
}
