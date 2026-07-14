import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type AuthUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Handles POST requests to finalize a quiz attempt.
 * Computes scores dynamically and updates completion status.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId, timeTakenSec } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    // Fetch attempt, saved answers, and the associated quiz questions count
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Quiz attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== (session.user as unknown as AuthUser).id) {
      return NextResponse.json({ error: "Unauthorized access to attempt" }, { status: 403 });
    }

    const answers = attempt.answers;
    const totalQuestions = attempt.quiz.questions.length;
    
    let correctCount = 0;
    for (const ans of answers) {
      if (ans.isCorrect) {
        correctCount++;
      }
    }

    const wrongCount = totalQuestions - correctCount;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Finalize attempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completed: true,
        scorePercentage,
        correctCount,
        wrongCount,
        timeTakenSec: timeTakenSec !== undefined ? timeTakenSec : attempt.timeTakenSec,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
    });
  } catch (error) {
    console.error("Failed to complete attempt:", error);
    return NextResponse.json({ error: "Failed to complete quiz attempt" }, { status: 500 });
  }
}
