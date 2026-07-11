import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Handles POST requests to save or update an individual answer in an active attempt.
 * Also keeps the elapsed time updated in the attempt.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId, questionId, selectedAnswer, isCorrect, timeTakenSec } = await req.json();

    if (!attemptId || !questionId || selectedAnswer === undefined || isCorrect === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify the attempt exists and belongs to the active user
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Quiz attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
    }

    if (attempt.completed) {
      return NextResponse.json({ error: "Quiz attempt is already completed" }, { status: 400 });
    }

    // 2. Check if this question was already answered in this attempt
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        attemptId,
        questionId,
      },
    });

    if (existingAnswer) {
      // Update existing answer selection
      await prisma.userAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedAnswer,
          isCorrect,
        },
      });
    } else {
      // Create new answer selection
      await prisma.userAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedAnswer,
          isCorrect,
        },
      });
    }

    // 3. Update the overall time taken so far in the attempt
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        timeTakenSec,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save answer:", error);
    return NextResponse.json({ error: "Failed to save answer progress" }, { status: 500 });
  }
}
