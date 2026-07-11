import { NextResponse } from "next/server";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { PDFParse } from "pdf-parse";

// Helper function to call Gemini for a specific prompt
async function generateQuestionsBatch(prompt: string) {
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
    },
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("Failed to generate content");
  }

  return JSON.parse(resultText);
}

// Helper to chunk text
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

export async function POST(req: Request) {
  try {
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
        // Limit context to the last 50 questions to avoid huge token usage on very large topics
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
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        fullText = data.text;
      }

      // Chunk the text to avoid token limits (e.g. 15000 chars per chunk)
      const textChunks = chunkText(fullText, 15000);
      
      // Process chunks sequentially to avoid rate limiting
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
          // Continue with other chunks even if one fails
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const N = allGeneratedQuestions.length;

    if (N === 0) {
      return NextResponse.json({ error: "No questions could be generated from the provided content" }, { status: 400 });
    }

    // Determine which topic ID to use as the FK anchor for Question.topicId.
    // • If a specific subtopic was provided (existingTopicId), questions belong to that topic.
    // • Otherwise, find-or-create a single hidden sentinel topic so we never create a fresh
    //   named topic entry that would pollute the admin taxonomy listing.
    let questionTopicId: string;

    if (topic) {
      // existingTopicId was provided — use it both for quiz linking and question FK
      questionTopicId = topic.id;
    } else {
      // Standalone generation: reuse (or create once) a hidden sentinel topic.
      // It has no exam link and no parent, so it won't appear in public taxonomy.
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

    // If existing, continue quiz indices from the last one
    let currentQuizIndex = existingQuizzesCount > 0 ? existingQuizzesCount + 1 : 1;
    
    // We might also have partially filled quizzes (e.g. part 1 has 15 questions). 
    // To keep it simple, we just create new "Parts" starting from existingQuizzesCount + 1
    
    for (let i = 0; i < N; i += chunkSize) {
      const chunk = allGeneratedQuestions.slice(i, i + chunkSize);

      // Use a transaction so the quiz record is only persisted when questions are also saved.
      // If question insertion fails, the quiz row is rolled back — no empty quizzes left behind.
      await prisma.$transaction(async (tx) => {
        const quiz = await tx.quiz.create({
          data: {
            // Only connect to subtopic when one was explicitly provided
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
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
