import { NextResponse } from "next/server";

import { resolveQuizRoute } from "@/lib/quiz-routing";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const url = await resolveQuizRoute(quizId);

    if (!url) {
      return NextResponse.json({ error: "Quiz has no linked public route" }, { status: 404 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to resolve share url:", error);
    return NextResponse.json({ error: "Failed to resolve share url" }, { status: 500 });
  }
}

