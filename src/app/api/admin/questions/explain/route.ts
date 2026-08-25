import { NextResponse, after } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import {
  generateQuestionExplanation,
  translateExplanationAndHint,
} from "@/lib/services/ai-explain.service";
import { describeAiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/questions/explain
 * Generates or improves a question's explanation and hint using Gemini Multimodal Vision,
 * analyzing the attached image/diagram directly.
 * Returns the generated explanation immediately to the client modal, while asynchronously
 * synchronizing & translating across linked languages (English, Gujarati, Hindi) via after().
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { questionId, text, options, correctAnswer, imageUrl, topicTitle, language, saveToDatabase = true } = body;

    if (!text || !options || !Array.isArray(options) || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields (text, options, correctAnswer)." },
        { status: 400 }
      );
    }

    // Step 1: Fast, high-quality generation in the source question's language
    const result = await generateQuestionExplanation({
      text,
      options,
      correctAnswer,
      imageUrl,
      topicTitle,
      language,
    });

    // Step 2: Asynchronously sync and translate to linked language tracks in background
    if (questionId && saveToDatabase) {
      after(async () => {
        try {
          const questionRecord = await prisma.question.findUnique({
            where: { id: questionId },
          });

          if (questionRecord) {
            // Save active question explanation
            await prisma.question.update({
              where: { id: questionId },
              data: {
                description: result.explanation,
                hint: result.hint,
              },
            });

            // Find linked sister questions in other languages
            const rootId = questionRecord.sourceQuestionId || questionRecord.id;
            const linkedQuestions = await prisma.question.findMany({
              where: {
                id: { not: questionRecord.id },
                quizId: questionRecord.quizId,
                OR: [{ id: rootId }, { sourceQuestionId: rootId }],
              },
            });

            // Translate and save to each linked language version
            for (const sibling of linkedQuestions) {
              try {
                const targetLang = (sibling.language || "en") as "en" | "gu" | "hi";
                const translated = await translateExplanationAndHint({
                  explanation: result.explanation,
                  hint: result.hint,
                  targetLanguage: targetLang,
                });

                await prisma.question.update({
                  where: { id: sibling.id },
                  data: {
                    description: translated.explanation,
                    hint: translated.hint,
                  },
                });
              } catch (err) {
                console.warn(`Failed to translate explanation for sister question ${sibling.id} (${sibling.language}):`, err);
              }
            }
          }
        } catch (e) {
          console.warn("Background multilingual explanation sync notice:", e);
        }
      });
    }

    return NextResponse.json({
      success: true,
      explanation: result.explanation,
      hint: result.hint,
    });
  } catch (error) {
    console.error("Generate explanation error:", error);
    const errMeta = describeAiError(error);
    return NextResponse.json(
      { error: errMeta.message, errorMeta: errMeta.meta },
      { status: 500 }
    );
  }
}
