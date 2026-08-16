import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { GEMINI_MODEL, describeAiError, executeWithGeminiFailover } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { fetchImageAsBase64 } from "@/lib/services/ai-explain.service";

/**
 * POST /api/admin/elaborate
 * Cache-first: returns saved elaboration from DB if present.
 * On cache miss, calls Gemini, saves result, then returns it.
 * Accepts { questionId, force?: boolean } — force=true bypasses cache and regenerates.
 */
export async function POST(req: Request) {
  try {
    let body: { questionId?: string; force?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { questionId, force } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { topic: true }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Cache hit — return saved elaboration unless forced to regenerate
    if (question.elaboration && !force) {
      return NextResponse.json({ success: true, markdown: question.elaboration, cached: true });
    }

    // Load image for multimodal deep dive analysis if present
    const imageData = question.imageUrl ? await fetchImageAsBase64(question.imageUrl) : null;

    const prompt = `You are an expert tutor and university professor. Provide a comprehensive, high-quality markdown deep-dive explanation for the following question and its correct answer${imageData ? " (based on the attached circuit diagram / image)" : ""}. 
Topic: ${question.topic.title}
Question: ${question.text}
Correct Answer: ${question.correctAnswer}
Options were: ${question.options.join(", ")}

Your response should include:
1. A deep dive into the core concept${imageData ? " (referencing the specific components, polarities, connections, values, and features visible in the diagram)" : ""}.
2. Why the correct answer is right with step-by-step mathematical/physical derivation.
3. Why the other options are incorrect.
4. Practical takeaways or memory rules.
5. Suggested search-intent keywords for video tutorials and online web links (e.g. "Search YouTube for: [keyword]").
`;

    const contents: any[] = [];
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
      return response.text;
    });

    // Persist to DB for future cache hits
    await prisma.question.update({
      where: { id: questionId },
      data: { elaboration: markdown }
    });

    revalidateTag("deep-dives", { expire: 0 });

    return NextResponse.json({ success: true, markdown, cached: false });
  } catch (error) {
    console.error("Elaborate error:", error);
    const errMeta = describeAiError(error);
    return NextResponse.json({ error: errMeta.message, errorMeta: errMeta.meta }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/elaborate
 * Clears the saved elaboration from DB so it is regenerated on next request.
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
      data: { elaboration: null }
    });

    revalidateTag("deep-dives", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete elaboration error:", error);
    return NextResponse.json({ error: "Failed to delete elaboration" }, { status: 500 });
  }
}
