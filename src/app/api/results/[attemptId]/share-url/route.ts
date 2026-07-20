import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveQuizRoute } from "@/lib/quiz-routing";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            topics: {
              include: {
                exams: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const url = await resolveQuizRoute(attempt.quizId);

    if (!url) {
      return NextResponse.json({ error: "Quiz has no linked public route" }, { status: 404 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to resolve share url:", error);
    return NextResponse.json({ error: "Failed to resolve share url" }, { status: 500 });
  }
}

