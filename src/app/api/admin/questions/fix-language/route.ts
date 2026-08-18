import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Type } from "@google/genai";
import { ai, GEMINI_MODEL, describeAiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { stripNullBytes, sanitizeNullBytes, sanitizeQuestionText } from "@/lib/format";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

interface ProofreadQuestion {
  id?: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

const AI_TIMEOUT_MS = 60000;

/**
 * Proofreads and repairs Gujarati/multilingual question data via Gemini.
 */
async function proofreadQuestionsWithAi(
  questions: ProofreadQuestion[]
): Promise<ProofreadQuestion[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const prompt = `You are an expert Gujarati and multilingual academic editor and language proofreader for competitive exam question banks.

Proofread and fix language rendering, OCR corruption, and typographical errors for the ${questions.length} question(s) below.

CRITICAL VERBATIM PRESERVATION RULES:
1. NEVER substitute, modernize, translate, or paraphrase any Gujarati / Indic vocabulary or formal exam terminology (e.g. KEEP authentic terms like "અધ્યક્ષ", "કારોબારી", "સંચાલન", "વિધાન", "કથન", "પરિષદ", "બંધારણ", "ન્યાયતંત્ર").
2. FIX broken Unicode conjunct characters (જોડાક્ષરો), improper halant/virama rendering, OCR encoding glitches, and spelling typos.
3. PRESERVE question structure: For multi-statement questions (1., 2., 3. or (i), (ii), (iii)), format the premise and numbered statements with clean newline separation (\\n).
4. Extract exactly 4 clean options without letter prefixes like (A), (B).
5. The \`correctAnswer\` MUST match one of the 4 \`options\` EXACTLY string-for-string.
6. Provide or improve the \`hint\` and \`description\` explanation in the same language.

Questions to proofread:
${JSON.stringify(questions, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "You are a meticulous multilingual proofreader. You fix OCR artifacts, broken conjunct characters (જોડાક્ષર), and spelling mistakes in Gujarati/Hindi/English exam papers while strictly retaining the exact original terminology, tone, and verbatim vocabulary.",
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
 * POST /api/admin/questions/fix-language
 * Proofreads single or multiple questions, fixing Gujarati spelling/conjuncts and OCR errors.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, questionId, quizId } = body;

    // Case 1: Proofread an in-memory single question (from Question Editor before saving)
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
      const fixed = fixedList[0] || sanitizedInput;

      return NextResponse.json({
        success: true,
        question: fixed,
      });
    }

    // Case 2: Proofread an existing question in DB and persist changes
    if (questionId) {
      const existing = await prisma.question.findUnique({
        where: { id: questionId },
        include: { quiz: true },
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

      return NextResponse.json({
        success: true,
        question: updated,
      });
    }

    // Case 3: Proofread all questions in an entire quiz
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: { orderBy: { id: "asc" } },
          topics: { select: { id: true } },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      if (quiz.questions.length === 0) {
        return NextResponse.json({ success: true, updatedCount: 0, message: "Quiz has no questions to proofread." });
      }

      const batches: typeof quiz.questions[] = [];
      for (let i = 0; i < quiz.questions.length; i += 10) {
        batches.push(quiz.questions.slice(i, i + 10));
      }

      let totalUpdated = 0;

      for (const batch of batches) {
        const batchInput: ProofreadQuestion[] = batch.map((q) => ({
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
          totalUpdated++;
        }
      }

      revalidatePath("/exams");
      revalidatePath(`/admin/manage/quizzes/${quizId}/questions`);
      quiz.topics.forEach((t) => revalidatePath(`/topics/${t.id}`));
      await revalidateQuizAndRelated(quizId);

      return NextResponse.json({
        success: true,
        updatedCount: totalUpdated,
        message: `Successfully proofread and updated ${totalUpdated} question${totalUpdated !== 1 ? "s" : ""}.`,
      });
    }

    return NextResponse.json({ error: "Invalid request. Provide question, questionId, or quizId." }, { status: 400 });
  } catch (error) {
    console.error("AI language proofreading failed:", error);
    const errResult = describeAiError(error);
    return NextResponse.json({ error: errResult.message }, { status: 500 });
  }
}
