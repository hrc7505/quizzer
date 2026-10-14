import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";

/**
 * GET /api/user/export
 * Exports all personal data and quiz history stored for the authenticated user as a downloadable JSON document.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true,
            providerAccountId: true,
          },
        },
        attempts: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                language: true,
              },
            },
            answers: {
              select: {
                id: true,
                questionId: true,
                selectedAnswer: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportPayload = {
      description: "Quizzer User Data Transparency Export",
      exportedAt: new Date().toISOString(),
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      connectedAccounts: userData.accounts,
      quizHistory: userData.attempts.map((attempt) => ({
        attemptId: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz?.title,
        quizDifficulty: attempt.quiz?.difficulty,
        language: attempt.quiz?.language,
        scorePercentage: attempt.scorePercentage,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        timeTakenSec: attempt.timeTakenSec,
        completed: attempt.completed,
        createdAt: attempt.createdAt,
        answers: attempt.answers,
      })),
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="quizzer-user-data-${userData.id}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json({ error: "Failed to export user data" }, { status: 500 });
  }
}
