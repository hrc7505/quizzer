import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { generateQuestionExplanation } from "@/lib/services/ai-explain.service";
import { describeAiError } from "@/lib/gemini";

/**
 * POST /api/admin/questions/explain
 * Generates or improves a question's explanation and hint using Gemini Multimodal Vision,
 * analyzing the attached image/diagram directly.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, options, correctAnswer, imageUrl, topicTitle } = body;

    if (!text || !options || !Array.isArray(options) || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields (text, options, correctAnswer)." },
        { status: 400 }
      );
    }

    const result = await generateQuestionExplanation({
      text,
      options,
      correctAnswer,
      imageUrl,
      topicTitle,
    });

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
