import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";
import type { RecordedDataPurpose } from "@/features/profile/interfaces/Profile.interface";

const DATA_PURPOSES: RecordedDataPurpose[] = [
  {
    category: "Identity & Authentication",
    fields: ["id", "name", "email", "phoneNumber", "role", "OAuth Provider Account ID"],
    purpose: "Authenticates your identity securely and associates quiz attempts with your personal account.",
    retention: "Retained until account deletion.",
  },
  {
    category: "Quiz Performance & Progress",
    fields: ["quizId", "scorePercentage", "correctCount", "wrongCount", "timeTakenSec", "completed", "createdAt"],
    purpose: "Calculates scores, tracks study velocity, and enables you to resume in-progress quizzes where you left off.",
    retention: "Retained for your study history; can be cleared anytime by the user.",
  },
  {
    category: "Question Level Responses",
    fields: ["questionId", "selectedAnswer", "isCorrect"],
    purpose: "Provides detailed question-by-question review and shows why specific options were correct or incorrect.",
    retention: "Associated with the corresponding Quiz Attempt.",
  },
  {
    category: "Session & Security Logs",
    fields: ["sessionToken", "expiresAt"],
    purpose: "Maintains active login sessions and prevents unauthorized account hijacking.",
    retention: "Expires automatically based on token expiration.",
  },
];

/**
 * GET /api/user/profile
 * Retrieves authenticated user details, learning performance metrics,
 * recent attempts, and data transparency records.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            quiz: {
              select: {
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Total stored user answers count
    const totalAnswers = await prisma.userAnswer.count({
      where: {
        attempt: {
          userId,
        },
      },
    });

    // Compute aggregated statistics
    const completedAttempts = user.attempts.filter((a) => a.completed);
    const inProgressAttempts = user.attempts.filter((a) => !a.completed);

    const totalScore = completedAttempts.reduce((acc, a) => acc + a.scorePercentage, 0);
    const averageScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;
    const bestScore = completedAttempts.length > 0 ? Math.round(Math.max(...completedAttempts.map((a) => a.scorePercentage))) : 0;
    const totalTimeSec = user.attempts.reduce((acc, a) => acc + a.timeTakenSec, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        totalAttempts: user._count.attempts,
        completedAttempts: completedAttempts.length,
        inProgressAttempts: inProgressAttempts.length,
        averageScore,
        bestScore,
        totalTimeSec,
      },
      recentAttempts: user.attempts.map((a) => ({
        id: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz.title,
        scorePercentage: a.scorePercentage,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        timeTakenSec: a.timeTakenSec,
        completed: a.completed,
        createdAt: a.createdAt.toISOString(),
      })),
      recordedData: {
        userRecord: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        connectedAccounts: user.accounts,
        totalStoredAttempts: user._count.attempts,
        totalStoredAnswers: totalAnswers,
        purposes: DATA_PURPOSES,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Updates editable profile information (e.g. display name).
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = await req.json();
    const { name } = body;

    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name format" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
