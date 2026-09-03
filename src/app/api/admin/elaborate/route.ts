import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { GEMINI_MODEL, describeAiError, executeWithGeminiFailover } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { fetchImageAsBase64 } from "@/lib/services/ai-explain.service";
import { getLanguagePromptName } from "@/types/language";

/**
 * GET /api/admin/elaborate?questionId=...
 * Returns all saved elaborations across languages (en, gu, hi) for a question cluster.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        translations: true,
        sourceQuestion: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const baseQuestion = question.sourceQuestion || question;
    const allQuestions = [baseQuestion, ...(baseQuestion.translations || [])];

    const elaborations: Record<string, { questionId: string; elaboration: string | null }> = {};
    for (const q of allQuestions) {
      if (q.language) {
        elaborations[q.language] = {
          questionId: q.id,
          elaboration: q.elaboration || null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      baseQuestionId: baseQuestion.id,
      elaborations,
    });
  } catch (error) {
    console.error("Get elaborate error:", error);
    return NextResponse.json({ error: "Failed to fetch elaborations" }, { status: 500 });
  }
}

/**
 * POST /api/admin/elaborate
 * Generates or retrieves an AI deep-dive explanation for a question in the requested language (en, gu, hi).
 * Automatically caches results to PostgreSQL for instant future loads.
 *
 * Accepts { questionId, targetLanguage?: string, force?: boolean }
 */
export async function POST(req: Request) {
  try {
    let body: { questionId?: string; targetLanguage?: string; force?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { questionId, targetLanguage, force } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        topic: true,
        translations: { include: { topic: true } },
        sourceQuestion: {
          include: {
            topic: true,
            translations: { include: { topic: true } },
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const baseQuestion = question.sourceQuestion || question;
    const allQuestions = [baseQuestion, ...(baseQuestion.translations || [])];

    const targetLang = targetLanguage || question.language || "en";
    const matchingQuestion = allQuestions.find((q) => q.language === targetLang);

    // 1. Cache hit — return saved elaboration if present and not forced to regenerate
    if (matchingQuestion?.elaboration && !force) {
      return NextResponse.json({
        success: true,
        markdown: matchingQuestion.elaboration,
        cached: true,
        language: targetLang,
        questionId: matchingQuestion.id,
      });
    }

    // 2. Prepare multimodal inputs and prompt for Gemini
    const sourceData = matchingQuestion || baseQuestion;
    const imageUrl = sourceData.imageUrl || baseQuestion.imageUrl;
    const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null;

    const promptName = getLanguagePromptName(targetLang);
    const isRegional = targetLang === "gu" || targetLang === "hi";

    const prompt = `You are a distinguished university professor and master competitive exam coach.
Provide a comprehensive, high-quality markdown deep-dive explanation in ${promptName} for the following question and its correct answer${imageData ? " (referencing the attached circuit / diagram image)" : ""}.

Topic: ${sourceData.topic?.title || baseQuestion.topic?.title || "General"}
Language: ${promptName}
Question: ${sourceData.text}
Correct Answer: ${sourceData.correctAnswer}
Options: ${sourceData.options.join(", ")}

CRITICAL LANGUAGE REQUIREMENT:
${
  isRegional
    ? `You MUST write the entire deep dive explanation in natural, fluent, and authentic academic ${promptName}. Use appropriate ${promptName} technical and competitive exam terminology. Keep formulas and code intact.`
    : `Write the deep dive explanation in clear, comprehensive academic English.`
}

Your deep dive must be structured with the following sections:
1. **Core Concept Overview:** Detailed breakdown of the foundational principle${imageData ? " (specifically detailing components, connections, polarity, values, and features visible in the diagram)" : ""}.
2. **Step-by-Step Analytical Derivation:** Comprehensive mathematical, logical, or physical derivation showing why '${sourceData.correctAnswer}' is undeniably correct.
3. **Incorrect Options Analysis:** Clear, educational explanation of why each incorrect option is flawed or under what alternative conditions it would apply.
4. **Key Exam Takeaways & Memory Rules:** High-yield memory hooks, shortcut formulas, or common pitfalls to remember for exams.
5. **Recommended Search Keywords:** Suggested search keywords in both ${promptName} and English for video tutorials and academic resources (e.g. "Search YouTube for: [keyword]").

Formatting Rules:
- Mathematical formulas: Format using standard LaTeX syntax ($...$ for inline, $$...$$ for block display). Keep all variable symbols and numbers exact.
- Programming code: Format using fenced Markdown code blocks (\`\`\`c, \`\`\`python, \`\`\`java).
- Do not output raw HTML tags.
`;

    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];
    if (imageData) {
      contents.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      });
    }
    contents.push(prompt);

    const markdown = await executeWithGeminiFailover(async (client) => {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents,
      });
      return response.text || "";
    });

    if (!markdown) {
      return NextResponse.json({ error: "AI generated empty response" }, { status: 500 });
    }

    // 3. Persist elaboration to database for this language
    let savedQuestionId = questionId;

    if (matchingQuestion) {
      await prisma.question.update({
        where: { id: matchingQuestion.id },
        data: { elaboration: markdown },
      });
      savedQuestionId = matchingQuestion.id;
    } else {
      // If no translated question record exists yet for this target language, create it
      const created = await prisma.question.create({
        data: {
          topicId: baseQuestion.topicId,
          quizId: baseQuestion.quizId,
          sourceQuestionId: baseQuestion.id,
          language: targetLang,
          text: baseQuestion.text,
          imageUrl: baseQuestion.imageUrl,
          invertInDark: baseQuestion.invertInDark,
          options: baseQuestion.options,
          correctAnswer: baseQuestion.correctAnswer,
          hint: baseQuestion.hint,
          description: baseQuestion.description,
          elaboration: markdown,
        },
      });
      savedQuestionId = created.id;
    }

    revalidateTag("deep-dives", { expire: 0 });

    return NextResponse.json({
      success: true,
      markdown,
      cached: false,
      language: targetLang,
      questionId: savedQuestionId,
    });
  } catch (error) {
    console.error("Elaborate error:", error);
    const errMeta = describeAiError(error);
    return NextResponse.json({ error: errMeta.message, errorMeta: errMeta.meta }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/elaborate
 * Clears the saved elaboration from DB for a specific question or its language translation.
 * Accepts { questionId } in request body.
 */
export async function DELETE(req: Request) {
  try {
    let body: { questionId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { questionId } = body;
    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }
    await prisma.question.update({
      where: { id: questionId },
      data: { elaboration: null },
    });

    revalidateTag("deep-dives", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete elaboration error:", error);
    return NextResponse.json({ error: "Failed to delete elaboration" }, { status: 500 });
  }
}
