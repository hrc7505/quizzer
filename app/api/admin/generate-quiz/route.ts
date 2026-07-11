import { NextResponse } from "next/server";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import PDFParser from "pdf2json";
import fs from "fs";
import path from "path";
import os from "os";

const AI_TIMEOUT_MS = 120000;

function extractJson(text: string): any {
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
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\.(png|jpg|jpeg|gif|bmp|webp|svg).*?\)/gi, "")
    .replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=\s]+/gi, "")
    .replace(/\[image.*?\]/gi, "")
    .replace(/\[img.*?\]/gi, "")
    .replace(/\b(image|img|figure|photo|picture)\.(png|jpg|jpeg|gif|bmp|webp|svg)\b/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const tempFile = path.join(os.tmpdir(), `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  
  try {
    fs.writeFileSync(tempFile, buffer);

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData}`));
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

async function generateQuestionsBatch(prompt: string): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
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

    return extractJson(resultText);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("AI content generation timed out. Try again with smaller input or a longer timeout.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    const existingTopicId = formData.get("existingTopicId") as string | null;
    let topicTitle = formData.get("topicTitle") as string;
    const difficulty = formData.get("difficulty") as string;

    if (!mode || (!topicTitle && !existingTopicId) || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let existingQuestionsText = "";
    let existingQuizzesCount = 0;
    let topic: any = null;

    if (existingTopicId) {
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
          recentQuestions.map((q: any) => `- ${q.text}`).join("\n");
      }
    }

    let allGeneratedQuestions: any[] = [];

    if (mode === "title") {
      const prompt = `Generate a comprehensive multiple-choice quiz about the following topic: "${topicTitle}".
Difficulty level: ${difficulty}.
Provide up to 30 distinct questions covering different aspects of the topic.
Each question must have exactly 4 options.
One option must be the correct answer (matching the string exactly).
Provide a hint and a detailed description/explanation for the answer.${existingQuestionsText}`;

      allGeneratedQuestions = await generateQuestionsBatch(prompt);

    } else if (mode === "text" || mode === "pdf") {
      let fullText = "";

      if (mode === "text") {
        fullText = formData.get("topicText") as string;
        if (!fullText) return NextResponse.json({ error: "Missing topicText" }, { status: 400 });
      } else {
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "Missing pdf file" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await parsePdfBuffer(buffer);
        fullText = sanitizePdfText(text);
      }

      const textChunks = chunkText(fullText, 15000);

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        const prompt = `You are an expert quiz parser and generator.
Analyze the following text content and perform one of the following tasks:
1. If the text already contains a list of questions, quizzes, or a question bank (with options and/or answers), your task is to extract ALL of those questions. Do not skip, summarize, or omit any of them. Parse every single question present in the text chunk.
2. If the text is general reading/study material or informational text (without pre-existing questions), generate up to 25 high-quality, comprehensive multiple-choice questions based on the key concepts in the text.

Difficulty level for the questions: ${difficulty}.
Each question must have exactly 4 options.
One option must be the correct answer (matching the string exactly).
Provide a hint and a detailed description/explanation for why the answer is correct.${existingQuestionsText}

Text content to analyze:
${chunk}`;

        try {
          const batchQuestions = await generateQuestionsBatch(prompt);
          allGeneratedQuestions = [...allGeneratedQuestions, ...batchQuestions];
        } catch (err) {
          console.warn(`Failed to process chunk ${i + 1}/${textChunks.length}`, err);
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const N = allGeneratedQuestions.length;

    if (N === 0) {
      return NextResponse.json({ error: "No questions could be generated from the provided content" }, { status: 400 });
    }

    let questionTopicId: string;

    if (topic) {
      questionTopicId = topic.id;
    } else {
      let sentinel = await prisma.topic.findFirst({
        where: { title: "__internal__" }
      });
      if (!sentinel) {
        sentinel = await prisma.topic.create({
          data: { title: "__internal__" }
        });
      }
      topic = sentinel;
      questionTopicId = sentinel.id;
    }

    const chunkSize = 30;
    const numQuizzes = Math.ceil(N / chunkSize);
    let currentQuizIndex = existingQuizzesCount > 0 ? existingQuizzesCount + 1 : 1;

    for (let i = 0; i < N; i += chunkSize) {
      const chunk = allGeneratedQuestions.slice(i, i + chunkSize);

      try {
        await prisma.$transaction(async (tx: any) => {
          const quiz = await tx.quiz.create({
            data: {
              ...(existingTopicId ? { topics: { connect: { id: existingTopicId } } } : {}),
              title: (existingQuizzesCount > 0 || numQuizzes > 1) ? `${topicTitle} - Part ${currentQuizIndex}` : topicTitle,
              difficulty,
              quizOrder: currentQuizIndex,
            }
          });

          await tx.question.createMany({
            data: chunk.map((q: any) => ({
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

    return NextResponse.json({
      success: true,
      topicId: topic.id,
      totalQuestions: N,
      quizzesCreated: numQuizzes,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
