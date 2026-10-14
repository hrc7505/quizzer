import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";

import type { RecordedDataPurpose } from "@/features/profile/interfaces/Profile.interface";

const DATA_PURPOSES: RecordedDataPurpose[] = [
  {
    category: "Identity & Authentication",
    badge: "Account Identity",
    iconName: "user",
    fields: [
      { key: "id", label: "User ID", description: "Unique database identifier for your account" },
      { key: "name", label: "Full Name", description: "Display name from your profile or Google login" },
      { key: "email", label: "Email Address", description: "Primary contact and sign-in email address" },
      { key: "phoneNumber", label: "Phone Number", description: "Optional contact phone number" },
      { key: "role", label: "Account Role", description: "Platform permission level (USER / ADMIN)" },
      { key: "providerAccountId", label: "OAuth ID", description: "Secure federated login token from Google" },
    ],
    purpose: "Authenticates your identity securely and associates quiz attempts with your personal account.",
    retention: "Retained until account deletion.",
    isClearable: false,
  },
  {
    category: "Quiz Performance & Progress",
    badge: "Study History",
    iconName: "trophy",
    fields: [
      { key: "quizId", label: "Quiz Reference", description: "Database identifier for the taken test" },
      { key: "scorePercentage", label: "Score %", description: "Calculated exam accuracy score (0-100%)" },
      { key: "correctCount", label: "Correct Answers", description: "Number of questions answered correctly" },
      { key: "wrongCount", label: "Incorrect Answers", description: "Number of wrong or missed questions" },
      { key: "timeTakenSec", label: "Time Taken", description: "Total duration in seconds spent solving" },
      { key: "completed", label: "Completion Status", description: "Whether the quiz was finished or paused" },
      { key: "createdAt", label: "Timestamp", description: "Exact date and time when the attempt was submitted" },
    ],
    purpose: "Calculates scores, tracks study velocity, and enables you to resume in-progress quizzes where you left off.",
    retention: "Retained for your study history; can be cleared anytime by the user.",
    isClearable: true,
  },
  {
    category: "Question Level Responses",
    badge: "Answer History",
    iconName: "check",
    fields: [
      { key: "questionId", label: "Question Reference", description: "Identifier of the question answered" },
      { key: "selectedAnswer", label: "Selected Answer", description: "The specific option choice you clicked" },
      { key: "isCorrect", label: "Correctness State", description: "Whether your choice was right or wrong" },
    ],
    purpose: "Provides detailed question-by-question review and shows why specific options were correct or incorrect.",
    retention: "Associated with the corresponding Quiz Attempt; purged if attempt is deleted.",
    isClearable: true,
  },
  {
    category: "Session & Security Logs",
    badge: "Session Auth",
    iconName: "shield",
    fields: [
      { key: "sessionToken", label: "Session Token", description: "Cryptographically signed JWT session key" },
      { key: "expiresAt", label: "Expiry Date", description: "Automatic expiration date of the active session" },
    ],
    purpose: "Maintains active login sessions and prevents unauthorized account hijacking.",
    retention: "Expires automatically based on token expiration.",
    isClearable: false,
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
