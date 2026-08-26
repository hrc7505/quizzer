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
import { sanitizeImageText, stripNullBytes, sanitizeNullBytes, sanitizeQuestionText } from "@/lib/format";

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

function sanitizePdfText(text: string): string {
  const lines = stripNullBytes(text).split("\n");
  const cleanedLines: string[] = [];

  const headerFooterPatterns = [
    /^\s*\d+\s*\|\s*\[.*?\]\s*\[Contd\.?/i,
    /^\s*\[.*?\]\s*P\.T\.O\.?\]?\s*\|\s*\d+/i,
    /^\s*\[Contd\.?/i,
    /^\s*P\.T\.O\.?/i,
    /^\s*Page\s+\d+\s+(?:of|\/)\s+\d+/i,
    /^\s*This Question Booklet Contains \d+ Printed Pages/i,
    /^\s*Question Booklet Series/i,
    /^\s*Total\s+(?:Ques|Questions|Marks)\s*:\s*\d+/i,
    /^\s*Time\s*:\s*\d+\s*Minutes/i,
    /^\s*કુલ\s+પ્રશ્નો\s*:\s*\d+/i,
    /^\s*કુલ\s+ગુણ\s*:\s*\d+/i,
    /^\s*સમય\s*:\s*\d+\s*મિનિટ/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (headerFooterPatterns.some((p) => p.test(trimmed))) continue;
    // Standalone booklet series letters on isolated lines like "M", "BNW"
    if (/^(?:[A-D|M|N|W|X|Y|Z]|BNW)$/.test(trimmed)) continue;
    cleanedLines.push(sanitizeImageText(line));
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extracts and separates individual question blocks from raw user text or PDF dumps.
 * Handles numbered (e.g. 1. ... 200.), multi-statement questions, and inline options without over-splitting.
 */
function extractQuestionBlocks(rawText: string): string[] {
  const text = stripNullBytes(rawText).replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const optionPattern = /(?:^\s*(?:[A-Da-d][\.\)]|\([A-Da-d]\))\s+|(?:[A-Da-d][\.\)]|\([A-Da-d]\))\s+)/;
  const lines = text.split("\n");

  // Strategy A: Check if the text contains numbered questions (e.g. 1. ... 200.)
  let hasSequentialNumbering = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:(?:Question|Q|Que|Ques)\s*[\.\:\-\#]?\s*1\b|^1[\.\)\:\-\]]\s+)/i.test(trimmed)) {
      hasSequentialNumbering = true;
      break;
    }
  }

  if (hasSequentialNumbering) {
    const blocks: string[] = [];
    let currentBlock: string[] = [];
    let currentQNum = 0;
    let started = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;

      const qMatch = trimmed.match(/^(?:(?:Question|Q|Que|Ques)\s*[\.\:\-\#]?\s*(\d{1,4})|^(\d{1,4})[\.\)\:\-\]])\s+/i);
      if (qMatch) {
        const numStr = qMatch[1] || qMatch[2];
        const qNum = parseInt(numStr, 10);

        if (!started) {
          if (qNum === 1) {
            started = true;
            currentQNum = 1;
            currentBlock = [line];
            continue;
          }
        } else {
          // Check if this is the next question in sequence (allowing small skips if OCR missed a number)
          if (qNum > currentQNum && qNum <= currentQNum + 5) {
            if (currentBlock.length > 0) {
              const blockText = currentBlock.join("\n").trim();
              if (optionPattern.test(blockText)) {
                blocks.push(blockText);
              }
            }
            currentQNum = qNum;
            currentBlock = [line];
            continue;
          }
        }
      }

      if (started) {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      const blockText = currentBlock.join("\n").trim();
      if (optionPattern.test(blockText)) {
        blocks.push(blockText);
      }
    }

    if (blocks.length > 0) {
      return blocks;
    }
  }

  // Strategy B: Paragraph or line-by-line state machine for unnumbered question banks
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2 && paragraphs.every((p) => optionPattern.test(p))) {
    return paragraphs;
  }

  const fallbackBlocks: string[] = [];
  let curBlock: string[] = [];
  let blockHasOptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (curBlock.length > 0) curBlock.push(line);
      continue;
    }

    const isOptionLine = /^\s*(?:[A-Da-d][\.\)]|\([A-Da-d]\))\s+/.test(trimmed);
    const startsWithQ = /^(?:Question|Q|Que|Ques)\s*[\.\:\-\#]?\s*\d+/i.test(trimmed) || /^\d+[\.\)\:\-\]]\s+/.test(trimmed);

    if (startsWithQ && curBlock.length > 0 && blockHasOptions) {
      const bText = curBlock.join("\n").trim();
      if (bText && optionPattern.test(bText)) fallbackBlocks.push(bText);
      curBlock = [line];
      blockHasOptions = isOptionLine;
    } else {
      curBlock.push(line);
      if (isOptionLine || optionPattern.test(line)) {
        blockHasOptions = true;
      }
    }
  }

  if (curBlock.length > 0) {
    const bText = curBlock.join("\n").trim();
    if (bText && optionPattern.test(bText)) fallbackBlocks.push(bText);
  }

  return fallbackBlocks.length > 0 ? fallbackBlocks : [text];
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const sentences = stripNullBytes(text).split(/(?<=[.?!])\s+/);

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
          resolve(stripNullBytes(text || ""));
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

/**
 * Checks whether an AI-generated question is an unwanted placeholder/dummy item.
 */
function isPlaceholderQuestion(q: GeneratedQuestion): boolean {
  if (!q || !q.text) return true;
  const lowerText = q.text.toLowerCase().trim();
  if (
    lowerText.includes("placeholder question") ||
    lowerText.includes("maintain count") ||
    lowerText.startsWith("placeholder") ||
    lowerText.includes("dummy question") ||
    lowerText.includes("sample question")
  ) {
    return true;
  }
  // Check dummy options like ["Option A", "Option B", "Option C", "Option D"]
  if (
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every((opt) => /^Option\s+[A-D]$/i.test(opt.trim()))
  ) {
    return true;
  }
  return false;
}

async function generateQuestionsBatch(prompt: string): Promise<GeneratedQuestion[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const safePrompt = sanitizeImageText(stripNullBytes(prompt));

  if (!ai) {
    throw new Error("AI service is not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: safePrompt,
      config: {
        systemInstruction:
          "You are a precise multilingual exam question processor. When processing regional languages such as Gujarati (ગુજરાતી) or Hindi (હિન્દી), you MUST preserve verbatim terminology, exact conjuncts (જોડાક્ષરો), grammar, and spelling from the input text without translation, paraphrasing, or substitution of words.\n\nCRITICAL COUNT INSTRUCTION:\n- When asked to parse N questions, output an array with EXACTLY N questions. NEVER generate dummy, filler, or placeholder questions like 'Placeholder question to maintain count'. Only output the actual real questions provided.\n\nCODE, MATH, AND MATCHING FORMATTING:\n- When question text, statements, or options contain programming code snippets (C, C++, Java, Python, JS, SQL, HTML, etc.), wrap them in fenced markdown with the language identifier (e.g. ```c ... ```) and preserve exact indentation and punctuation.\n- When questions or options contain mathematical formulas, equations, or scientific notation, use standard LaTeX syntax ($...$ for inline, $$...$$ for block display).\n- When questions are 'Match the following' / entity relationship questions (e.g. 'Match List-I with List-II', 'જોડકાં જોડો'), structure the text with 'List-I:' followed by lettered items (a), (b), (c)... and 'List-II:' followed by numbered items (1), (2), (3)...",
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

    const rawJson = extractJson(resultText);
    const sanitized = sanitizeNullBytes(rawJson) as GeneratedQuestion[];
    const validQuestions = Array.isArray(sanitized)
      ? sanitized.filter((q) => !isPlaceholderQuestion(q))
      : [];
    return validQuestions;
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
        "language" TEXT NOT NULL DEFAULT 'en',
        "difficulty" TEXT NOT NULL DEFAULT 'Medium',
        "rawText" TEXT NOT NULL,
        "batchIndex" INTEGER NOT NULL DEFAULT 1,
        "totalBatches" INTEGER NOT NULL DEFAULT 1,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "error" TEXT,
        "padTo30" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "QuizBatch_topicId_idx" ON "QuizBatch"("topicId");
      CREATE INDEX IF NOT EXISTS "QuizBatch_status_idx" ON "QuizBatch"("status");
      ALTER TABLE "QuizBatch" ADD COLUMN IF NOT EXISTS "padTo30" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "QuizBatch" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
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
    if (batch.status === "PAUSED") {
      return { success: false, error: "Batch is paused" };
    }

    await prisma.quizBatch.update({
      where: { id: batchId },
      data: { status: "PROCESSING", error: null },
    });

    const rawQuestions = extractQuestionBlocks(batch.rawText);
    const parsedQuestions: GeneratedQuestion[] = [];
    let batchFailed = false;
    let batchErrorMessage = "";

    for (let j = 0; j < rawQuestions.length; j += 30) {
      // Re-check status before calling AI in case batch was paused in the meantime
      const currentBatchStatus = await prisma.quizBatch.findUnique({
        where: { id: batchId },
        select: { status: true },
      });
      if (currentBatchStatus?.status === "PAUSED") {
        return { success: false, error: "Batch paused by user" };
      }

      const subBatch = rawQuestions.slice(j, j + 30);
      const isPaddingAllowed = batch.padTo30;

      const prompt = `You are an expert quiz parser.
The user provided ${subBatch.length} multiple-choice question(s) below.
Your task is to parse and extract EVERY SINGLE question into the structured JSON array. Do not omit, skip, or drop any question.

Formatting rules:
1. Clean the question text by removing any leading overall question numbers (e.g. "49. ").
2. CODE DETECTION & FORMATTING:
   - When question text, statements, or options contain programming code, functions, or algorithms (e.g., C, C++, Python, Java, JavaScript, SQL, HTML/CSS), ALWAYS format them into a fenced Markdown code block with the specific language identifier (e.g. \`\`\`c ... \`\`\`, \`\`\`python ... \`\`\`, \`\`\`sql ... \`\`\`).
   - Preserve exact code indentation, whitespace, semicolons, brackets, and line breaks.
   - For short inline identifiers, variable/type declarations, prototypes, or functions (e.g., \`int a;\`, \`int *f();\`, \`char (*(*x()))();\`, \`int *\`, \`printf()\`), ALWAYS wrap them in inline backticks \`...\`.
3. MATH, EXPONENTS & EQUATIONS DETECTION:
   - When mathematical formulas, superscripts/exponents (e.g. $2^n$, $2^n - 1$, $2^n - 2$, $2(2^n - 2)$, $x^2$), subscripts ($x_i$), fractions ($\frac{a}{b}$), relational inequalities ($n \ge 2$, $x \le 5$, $\neq$), or matrices appear, ALWAYS format them in standard LaTeX math notation ($...$ for inline and options, $$...$$ for block display).
   - In options containing mathematical formulas (e.g., $2^n$, $2^n - 1$), ALWAYS wrap them in single dollar signs like \`$2^n$\`, \`$2^n - 1$\`, \`$2(2^n - 2)$\`. NEVER leave raw unescaped carets like \`2^n\`.
   - Fix OCR symbol misreadings (e.g., convert "n ∝ 2" or "n \propto 2" to "$n \ge 2$").
4. MATCH THE FOLLOWING & ENTITY RELATIONS:
   - When parsing 'Match the following' questions (or questions showing relationships between concepts/algorithms/entities, 'List-I with List-II', 'જોડકાં જોડો'):
     - Format the text with clear lists:
       List-I:
       (a) Entity 1
       (b) Entity 2
       (c) Entity 3
       (d) Entity 4
       List-II:
       (1) Target 1
       (2) Target 2
       (3) Target 3
       (4) Target 4
     - Options should represent clean matching pairs (e.g. "a-3, b-1, c-2, d-4").
5. For multi-statement questions (e.g. questions containing statements 1., 2., 3. or (i), (ii), (iii) or Assertion-Reason / કથન-કારણ), ALWAYS format the question text with newlines (\\n) separating the premise and each numbered statement. NEVER merge statements into a single paragraph.
6. Extract the 4 options and trim any leading option letters like "(a)", "(b)", "A.", "B)" so only the clean option text remains.
7. Identify and set the correct answer (matching one of the 4 cleaned option strings exactly).
8. Provide a helpful hint and a detailed technical explanation for why the answer is correct (formatted in markdown with code blocks and LaTeX math where applicable).
9. CRITICAL VERBATIM ACCURACY: Do NOT rephrase, modernize, translate, or substitute any words in Gujarati/Indic regional text. Keep all authentic terminology, conjuncts (જોડાક્ષર), questions, and options EXACTLY verbatim as provided in the source text.
${
  isPaddingAllowed
    ? `10. PADDING ALLOWED: If fewer than 30 questions are provided, you may generate complementary questions on "${batch.title}" to reach 30 questions. DO NOT generate dummy/placeholder questions.`
    : `10. STRICT QUESTION COUNT: Return EXACTLY the ${subBatch.length} question(s) provided in the source text. DO NOT generate, fabricate, or add ANY new questions to pad the count. DO NOT output placeholder questions like 'Placeholder question to maintain count'. Return exactly ${subBatch.length} items in the JSON array.`
}

Difficulty level: ${batch.difficulty}.

Questions to parse:
${subBatch.join("\n\n")}`;

      try {
        const batchRes = await generateQuestionsBatch(sanitizeImageText(prompt));
        const realQuestions = batchRes.filter((q) => !isPlaceholderQuestion(q));
        const filteredRes = isPaddingAllowed ? realQuestions : realQuestions.slice(0, subBatch.length);
        parsedQuestions.push(...filteredRes);
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
          error: stripNullBytes(batchErrorMessage || "No valid questions could be extracted."),
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

    const quizTitle = stripNullBytes(batch.totalBatches > 1
      ? `${batch.title} - Part ${batch.batchIndex}`
      : batch.title);

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const quiz = await tx.quiz.create({
          data: {
            ...(batch.topicId ? { topics: { connect: { id: batch.topicId } } } : {}),
            title: quizTitle,
            language: batch.language || "en",
            difficulty: stripNullBytes(batch.difficulty) || "Medium",
            quizOrder,
          },
        });

        await tx.question.createMany({
          data: parsedQuestions.map((q) => ({
            topicId: questionTopicId,
            quizId: quiz.id,
            text: sanitizeQuestionText(q.text),
            options: (q.options || []).map((opt) => stripNullBytes(opt)),
            correctAnswer: stripNullBytes(q.correctAnswer),
            hint: stripNullBytes(q.hint || ""),
            description: stripNullBytes(q.description || ""),
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
    let topicTitle = stripNullBytes(formData.get("topicTitle") as string || "");
    const existingTopicId = stripNullBytes(formData.get("existingTopicId") as string || "");
    const targetQuizId = stripNullBytes(formData.get("targetQuizId") as string || "");
    const difficulty = stripNullBytes(formData.get("difficulty") as string || "Medium");
    const language = stripNullBytes(formData.get("language") as string || "en");
    const padTo30 = formData.get("padTo30") === "true";

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
Provide a hint and a detailed description/explanation for the answer.

Formatting rules:
1. When questions or options involve programming code, algorithms, or queries, format them using fenced Markdown code blocks with appropriate language tags (e.g. \`\`\`c, \`\`\`python, \`\`\`sql) and preserve exact indentation.
2. When questions or options involve mathematical formulas or equations, format them using LaTeX math delimiters ($...$ or $$...$$).${existingQuestionsText}`;

      allGeneratedQuestions = await generateQuestionsBatch(sanitizeImageText(prompt));

    } else if (mode === "text" || mode === "pdf") {
      let fullText = "";

      if (mode === "text") {
        fullText = stripNullBytes(formData.get("topicText") as string || "");
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
      const optionInlinePattern = /(?:[A-Da-d][\.\)]|\([A-Da-d]\))/;
      const isQuestionBank = questionBlocks.length > 1 || (questionBlocks.length === 1 && optionInlinePattern.test(questionBlocks[0]));

      if (isQuestionBank) {
        // User pasted questions: group into 30-question bunches (each bunch = 1 Quiz)
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
                title: stripNullBytes(topicTitle),
                language,
                difficulty: stripNullBytes(difficulty) || "Medium",
                rawText: stripNullBytes(bunch.join("\n\n")),
                batchIndex: idx + 1,
                totalBatches,
                status: "PENDING",
                padTo30,
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
            const current = await prisma.quizBatch.findUnique({ where: { id: b.id } });
            if (!current || current.status === "PAUSED") continue;
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
Provide a hint and a detailed description/explanation for why the answer is correct.

Formatting rules:
1. When questions or options involve programming code or scripts, format them using fenced Markdown code blocks (e.g. \`\`\`c, \`\`\`python, \`\`\`java).
2. When questions or options involve math or scientific equations, format them using LaTeX ($...$ or $$...$$).${existingQuestionsText}

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
            text: sanitizeQuestionText(q.text),
            options: (q.options || []).map((opt) => stripNullBytes(opt)),
            correctAnswer: stripNullBytes(q.correctAnswer),
            hint: stripNullBytes(q.hint || ""),
            description: stripNullBytes(q.description || ""),
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
              title: stripNullBytes((existingQuizzesCount > 0 || numQuizzes > 1) ? `${topicTitle} - Part ${currentQuizIndex}` : topicTitle),
              language,
              difficulty: stripNullBytes(difficulty) || "Medium",
              quizOrder: currentQuizIndex,
            }
          });

          await tx.question.createMany({
            data: chunk.map((q) => ({
              topicId: questionTopicId,
              quizId: quiz.id,
              text: sanitizeQuestionText(q.text),
              options: (q.options || []).map((opt) => stripNullBytes(opt)),
              correctAnswer: stripNullBytes(q.correctAnswer),
              hint: stripNullBytes(q.hint || ""),
              description: stripNullBytes(q.description || ""),
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
