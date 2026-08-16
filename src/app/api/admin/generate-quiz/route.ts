import { NextResponse, after } from "next/server";
import { Type } from "@google/genai";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import PDFParser from "pdf2json";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";
import { sanitizeImageText } from "@/lib/format";

import fs from "fs";
import path from "path";
import os from "os";

function isPdfFile(file: File): boolean {
  const name = file.name?.toLowerCase() ?? "";
  const type = file.type?.toLowerCase() ?? "";
  return name.endsWith(".pdf") || type === "application/pdf";
}


type GeneratedQuestion = {
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
};

type TopicWithQuestions = Prisma.TopicGetPayload<{
  include: { quizzes: true; questions: { select: { text: true } } };
}>;

const AI_TIMEOUT_MS = 60000;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  return JSON.parse(trimmed);
}

/**
 * Extracts and separates individual question blocks from raw user text or PDF dumps.
 * Handles numbered (e.g. "1.", "45)", "Q1:"), unnumbered questions, markdown, and inline options.
 */
function extractQuestionBlocks(rawText: string): string[] {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // 1. If text is formatted with double newlines separating question blocks
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  const optionInlinePattern = /(?:[A-Da-d][\.\)]|\([A-Da-d]\))/;

  if (paragraphs.length >= 2 && paragraphs.every((p) => optionInlinePattern.test(p))) {
    return paragraphs;
  }

  // 2. Line-by-line state machine for single-spaced, unnumbered, or numbered questions
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  const optionPattern = /^\s*(?:[A-Da-d][\.\)]|\([A-Da-d]\))\s+/;
  const answerPattern = /^\s*(?:Ans(?:wer)?|Correct(?:\s*Answer)?|Key|Explanation)[\s\:\-\.]/i;

  let hasSeenOptions = false;

  function isLineQuestionStart(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Explicit prefix (Q1, Question 1, Que 1, etc.)
    if (/^(?:[\*\_\#\s]*(?:Question|Q|Que|Ques)\s*[\.\:\-\#]?\s*\d+)/i.test(trimmed)) {
      return true;
    }

    // Numbered prefix: e.g. "1. ", "2. ", "45. ", "[3] ", "1) "
    const cleaned = trimmed.replace(/^[\*\_\#\s]+/, "");
    if (/^\[?\d+[\.\)\:\-\]]\s+/.test(cleaned)) {
      if (hasSeenOptions && optionPattern.test(cleaned)) {
        return false;
      }
      return true;
    }

    return false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentBlock.length > 0) currentBlock.push(line);
      continue;
    }

    const isOption = optionPattern.test(trimmed);
    const isAnswer = answerPattern.test(trimmed);
    const isQuestion = isLineQuestionStart(trimmed);

    // An unnumbered question starts when the previous block already had options/answers,
    // and the current line is a new question statement (i.e. not an option and not an answer)
    const isNewUnnumbered = hasSeenOptions && !isOption && !isAnswer;

    if ((isQuestion || isNewUnnumbered) && currentBlock.length > 0) {
      const blockText = currentBlock.join("\n").trim();
      if (blockText) blocks.push(blockText);
      currentBlock = [line];
      hasSeenOptions = isOption;
    } else {
      currentBlock.push(line);
      if (isOption || optionInlinePattern.test(line)) {
        hasSeenOptions = true;
      }
    }
  }

  if (currentBlock.length > 0) {
    const remaining = currentBlock.join("\n").trim();
    if (remaining) blocks.push(remaining);
  }

  return blocks.length >= 2 ? blocks : [text];
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const sentences = text.split(/(?<=[.?!])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence + " ";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function sanitizePdfText(text: string): string {
  return text
    .split("\n")
    .map(line => sanitizeImageText(line))
    .filter(line => line.trim() !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const tempFile = path.join(os.tmpdir(), `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  
  try {
    fs.writeFileSync(tempFile, buffer);

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: unknown) => {
        reject(new Error(`PDF parsing error: ${String(errData)}`));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        try {
          const text = pdfParser.getRawTextContent();
          resolve(text || "");
        } catch (err) {
          reject(err);
        }
      });

      pdfParser.loadPDF(tempFile);
    });
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function generateQuestionsBatch(prompt: string): Promise<GeneratedQuestion[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const safePrompt = sanitizeImageText(prompt);

  if (!ai) {
    throw new Error("AI service is not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: safePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
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
      throw new Error("Failed to generate content");
    }

    return extractJson(resultText) as GeneratedQuestion[];
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("AI content generation timed out. Try again with smaller input or a longer timeout.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function ensureQuizBatchTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "QuizBatch" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "topicId" TEXT,
        "title" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL DEFAULT 'Medium',
        "rawText" TEXT NOT NULL,
        "batchIndex" INTEGER NOT NULL DEFAULT 1,
        "totalBatches" INTEGER NOT NULL DEFAULT 1,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "QuizBatch_topicId_idx" ON "QuizBatch"("topicId");
      CREATE INDEX IF NOT EXISTS "QuizBatch_status_idx" ON "QuizBatch"("status");
    `);
  } catch (err) {
    console.warn("ensureQuizBatchTable warning:", err);
  }
}

export async function processBatchById(batchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureQuizBatchTable();
    const batch = await prisma.quizBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) return { success: false, error: "Batch not found" };

    await prisma.quizBatch.update({
      where: { id: batchId },
      data: { status: "PROCESSING", error: null },
    });

    const rawQuestions = extractQuestionBlocks(batch.rawText);
    const parsedQuestions: GeneratedQuestion[] = [];
    let batchFailed = false;
    let batchErrorMessage = "";

    for (let j = 0; j < rawQuestions.length; j += 30) {
      const subBatch = rawQuestions.slice(j, j + 30);
      const prompt = `You are an expert quiz parser.
The user provided ${subBatch.length} multiple-choice question(s) below.
Your task is to parse and extract EVERY SINGLE question into the structured JSON array. Do not omit, skip, or drop any question.

Formatting rules:
1. Clean the question text by removing any leading question numbers (e.g. "49. ").
2. Extract the 4 options and trim any leading option letters like "(a)", "(b)", "A.", "B)" so only the clean option text remains.
3. Identify and set the correct answer (matching one of the 4 cleaned option strings exactly).
4. Provide a helpful hint and a detailed technical explanation for why the answer is correct.

Difficulty level: ${batch.difficulty}.

Questions to parse:
${subBatch.join("\n\n")}`;

      try {
        const batchRes = await generateQuestionsBatch(sanitizeImageText(prompt));
        parsedQuestions.push(...batchRes);
      } catch (err) {
        console.warn(`Batch AI generation failure for batch ${batch.id}:`, err);
        batchFailed = true;
        batchErrorMessage = describeAiError(err).message;
        break;
      }
    }

    if (batchFailed || parsedQuestions.length === 0) {
      await prisma.quizBatch.update({
        where: { id: batchId },
        data: {
          status: "FAILED",
          error: batchErrorMessage || "No valid questions could be extracted.",
        },
      });
      return { success: false, error: batchErrorMessage || "No questions generated" };
    }

    // Determine target topic
    let questionTopicId: string;
    if (batch.topicId) {
      questionTopicId = batch.topicId;
    } else {
      let sentinel = await prisma.topic.findFirst({
        where: { title: INTERNAL_TOPIC_TITLE },
      });
      if (!sentinel) {
        sentinel = await prisma.topic.create({
          data: { title: INTERNAL_TOPIC_TITLE },
        });
      }
      questionTopicId = sentinel.id;
    }

    const existingQuizzesCount = batch.topicId
      ? await prisma.quiz.count({ where: { topics: { some: { id: batch.topicId } } } })
      : 0;
    const quizOrder = existingQuizzesCount + 1;

    const quizTitle = batch.totalBatches > 1
      ? `${batch.title} - Part ${batch.batchIndex}`
      : batch.title;

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const quiz = await tx.quiz.create({
          data: {
            ...(batch.topicId ? { topics: { connect: { id: batch.topicId } } } : {}),
            title: quizTitle,
            difficulty: batch.difficulty,
            quizOrder,
          },
        });

        await tx.question.createMany({
          data: parsedQuestions.map((q) => ({
            topicId: questionTopicId,
            quizId: quiz.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            hint: q.hint,
            description: q.description,
          })),
        });

        // Automatically delete completed batch from database upon success
        await tx.quizBatch.delete({
          where: { id: batch.id },
        });
      },
      { maxWait: 10000, timeout: 30000 }
    );

    revalidatePath("/admin/manage/batches");
    if (batch.topicId) {
      revalidatePath(`/admin/manage/subtopics/${batch.topicId}/quizzes`);
      revalidatePath(`/topics/${batch.topicId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Batch processing error:", error);
    const errRes = describeAiError(error);
    await prisma.quizBatch.update({
      where: { id: batchId },
      data: { status: "FAILED", error: errRes.message },
    }).catch(() => null);
    return { success: false, error: errRes.message };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    let topicTitle = formData.get("topicTitle") as string;
    const existingTopicId = formData.get("existingTopicId") as string;
    const targetQuizId = formData.get("targetQuizId") as string;
    const difficulty = formData.get("difficulty") as string;

    if (!mode || (!topicTitle && !existingTopicId && !targetQuizId) || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let existingQuestionsText = "";
    let existingQuizzesCount = 0;
    let topic: TopicWithQuestions | null = null;
    let targetQuiz: { id: string; title: string; topics: { id: string }[]; questions: { text: string }[] } | null = null;

    if (targetQuizId) {
      targetQuiz = await prisma.quiz.findUnique({
        where: { id: targetQuizId },
        include: {
          topics: { select: { id: true } },
          questions: { select: { text: true } },
        },
      });

      if (!targetQuiz) {
        return NextResponse.json({ error: "Target quiz to append to was not found" }, { status: 404 });
      }

      topicTitle = targetQuiz.title;
      if (targetQuiz.questions.length > 0) {
        const recentQuestions = targetQuiz.questions.slice(-50);
        existingQuestionsText = `\n\nCRITICAL: Do NOT generate questions that are similar to these existing ones already in the quiz:\n` +
          recentQuestions.map((q) => `- ${q.text}`).join("\n");
      }
    } else if (existingTopicId) {
      topic = await prisma.topic.findUnique({
        where: { id: existingTopicId },
        include: { quizzes: true, questions: { select: { text: true } } }
      });
      if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

      topicTitle = topic.title;
      existingQuizzesCount = topic.quizzes.length;

      if (topic.questions.length > 0) {
        const recentQuestions = topic.questions.slice(-50);
        existingQuestionsText = `\n\nCRITICAL: Do NOT generate questions that are similar to these existing ones:\n` +
          recentQuestions.map((q) => `- ${q.text}`).join("\n");
      }
    }

    let questionTopicId: string;
    if (targetQuiz && targetQuiz.topics.length > 0) {
      questionTopicId = targetQuiz.topics[0].id;
    } else if (topic) {
      questionTopicId = topic.id;
    } else {
      let sentinel = await prisma.topic.findFirst({
        where: { title: INTERNAL_TOPIC_TITLE },
      });
      if (!sentinel) {
        sentinel = await prisma.topic.create({
          data: { title: INTERNAL_TOPIC_TITLE },
        });
      }
      topic = sentinel as unknown as TopicWithQuestions;
      questionTopicId = sentinel.id;
    }

    let allGeneratedQuestions: GeneratedQuestion[] = [];

    if (mode === "title") {
      const prompt = `Generate a comprehensive multiple-choice quiz about the following topic: "${topicTitle}".
Difficulty level: ${difficulty}.
Provide up to 30 distinct questions covering different aspects of the topic.
Each question must have exactly 4 options.
One option must be the correct answer (matching the string exactly).
Provide a hint and a detailed description/explanation for the answer.${existingQuestionsText}`;

      allGeneratedQuestions = await generateQuestionsBatch(sanitizeImageText(prompt));

    } else if (mode === "text" || mode === "pdf") {
      let fullText = "";

      if (mode === "text") {
        fullText = formData.get("topicText") as string;
        if (!fullText) return NextResponse.json({ error: "Missing topicText" }, { status: 400 });
      } else {
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "Missing pdf file" }, { status: 400 });

        if (!isPdfFile(file)) {
          return NextResponse.json({ error: "Only PDF files are supported for upload." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF")) {
          return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 });
        }

        const text = await parsePdfBuffer(buffer);
        if (!text.trim()) {
          return NextResponse.json({ error: "Could not extract text from the PDF. Ensure it contains readable text (not just scanned images)." }, { status: 400 });
        }
        fullText = sanitizePdfText(text);
      }

      const questionBlocks = extractQuestionBlocks(fullText);

      if (questionBlocks.length >= 2) {
        // User pasted a question bank: group into 30-question bunches (each bunch = 1 Quiz)
        const bunches: string[][] = [];
        for (let i = 0; i < questionBlocks.length; i += 30) {
          bunches.push(questionBlocks.slice(i, i + 30));
        }

        const totalBatches = bunches.length;

        // Ensure table exists on database (safe auto-migration fallback)
        await ensureQuizBatchTable();

        // 1. Create persistent QuizBatch records in DB for all batches immediately
        const batchRecords = await Promise.all(
          bunches.map((bunch, idx) =>
            prisma.quizBatch.create({
              data: {
                topicId: existingTopicId || null,
                title: topicTitle,
                difficulty,
                rawText: bunch.join("\n\n"),
                batchIndex: idx + 1,
                totalBatches,
                status: "PENDING",
              },
            })
          )
        );

        revalidatePath("/admin/manage/batches");
        if (existingTopicId) {
          revalidatePath(`/admin/manage/subtopics/${existingTopicId}/quizzes`);
        }

        // 2. Start asynchronous processing in background using Next.js after()
        after(async () => {
          for (const b of batchRecords) {
            await processBatchById(b.id);
            await new Promise((r) => setTimeout(r, 1500));
          }
        });

        // 3. Return immediately so batches appear instantly in the UI
        return NextResponse.json({
          success: true,
          isBatched: true,
          topicId: topic?.id ?? "",
          batchesCreated: totalBatches,
          totalQuestions: questionBlocks.length,
          message: `Created ${totalBatches} batch(es) with ${questionBlocks.length} questions in queue. Processing in background.`,
        });
      } else {
        // General text/study material without explicit question markers
        const textChunks = chunkText(fullText, 4000);

        for (let i = 0; i < textChunks.length; i++) {
          const chunk = textChunks[i];
          const prompt = `You are an expert quiz generator.
Generate up to 10 comprehensive multiple-choice questions based on the key concepts in the text below.

Difficulty level: ${difficulty}.
Each question must have exactly 4 options.
One option must be the correct answer (matching the string exactly).
Provide a hint and a detailed description/explanation for why the answer is correct.${existingQuestionsText}

Text content to analyze:
${chunk}`;

          try {
            const batchQuestions = await generateQuestionsBatch(sanitizeImageText(prompt));
            allGeneratedQuestions = [...allGeneratedQuestions, ...batchQuestions];
          } catch (err) {
            console.warn(`Failed to process chunk ${i + 1}/${textChunks.length}`, err);
          }
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const N = allGeneratedQuestions.length;

    if (N === 0) {
      return NextResponse.json({ error: "No questions could be generated from the provided content" }, { status: 400 });
    }

    // Branch 1: Append Questions to an Existing Quiz
    if (targetQuiz) {
      try {
        await prisma.question.createMany({
          data: allGeneratedQuestions.map((q) => ({
            topicId: questionTopicId,
            quizId: targetQuiz.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            hint: q.hint,
            description: q.description,
          })),
        });
      } catch (saveErr) {
        console.error("Failed to append questions to target quiz:", saveErr);
        return NextResponse.json({
          error: "Failed to save appended questions",
          detail: saveErr instanceof Error ? saveErr.message : "Unknown error"
        }, { status: 500 });
      }

      revalidatePath("/admin/manage/quizzes");
      revalidatePath(`/admin/manage/quizzes/${targetQuiz.id}/questions`);
      revalidatePath(`/quiz/${targetQuiz.id}`);
      revalidatePath("/exams");
      revalidatePath("/topics");

      return NextResponse.json({
        success: true,
        appended: true,
        quizId: targetQuiz.id,
        quizTitle: targetQuiz.title,
        totalQuestions: N,
        questionsAdded: N,
        quizzesCreated: 0,
      });
    }

    // Branch 2: Create New Quiz(zes)
    const chunkSize = 30;
    const numQuizzes = Math.ceil(N / chunkSize);
    let currentQuizIndex = existingQuizzesCount > 0 ? existingQuizzesCount + 1 : 1;

    for (let i = 0; i < N; i += chunkSize) {
      const chunk = allGeneratedQuestions.slice(i, i + chunkSize);

      try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const quiz = await tx.quiz.create({
            data: {
              ...(existingTopicId ? { topics: { connect: { id: existingTopicId } } } : {}),
              title: (existingQuizzesCount > 0 || numQuizzes > 1) ? `${topicTitle} - Part ${currentQuizIndex}` : topicTitle,
              difficulty,
              quizOrder: currentQuizIndex,
            }
          });

          await tx.question.createMany({
            data: chunk.map((q) => ({
              topicId: questionTopicId,
              quizId: quiz.id,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              hint: q.hint,
              description: q.description,
            })),
          });
        });
      } catch (txErr) {
        console.error(`Transaction failed for chunk ${currentQuizIndex}:`, txErr);
        return NextResponse.json({
          error: "Failed to persist quiz data",
          detail: txErr instanceof Error ? txErr.message : "Unknown error"
        }, { status: 500 });
      }

      currentQuizIndex++;
    }

    revalidatePath("/exams");
    revalidatePath("/topics");
    if (existingTopicId) {
      revalidatePath(`/topics/${existingTopicId}`);
      const topicData = await prisma.topic.findUnique({
        where: { id: existingTopicId },
        include: { exams: { select: { id: true } } }
      });
      topicData?.exams.forEach(e => revalidatePath(`/exams/${e.id}`));
    }

    return NextResponse.json({
      success: true,
      topicId: topic?.id ?? "",
      totalQuestions: N,
      quizzesCreated: numQuizzes,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    const errMeta = describeAiError(error);
    return NextResponse.json({ error: errMeta.message, errorMeta: errMeta.meta }, { status: 500 });
  }
}
