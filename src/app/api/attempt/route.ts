import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";


/**
 * Handles POST requests to start or retrieve an in-progress quiz attempt.
 * Supports `forceNew` parameter to discard previous attempt and start over.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const { quizId, forceNew, createOnNotFound = true } = await req.json();

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    // 1. Look for an existing in-progress attempt
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
        completed: false,
      },
      include: {
        answers: true,
      },
    });

    // 2. Discard if starting fresh
    if (forceNew) {
      await prisma.quizAttempt.deleteMany({
        where: {
          quizId,
          userId,
          completed: false,
        },
      });
    } else if (activeAttempt) {
      // Return existing attempt
      return NextResponse.json({
        success: true,
        attemptId: activeAttempt.id,
        answers: activeAttempt.answers,
        timeTakenSec: activeAttempt.timeTakenSec,
      });
    }

    // If we're just checking and none exists, do not create one
    if (!createOnNotFound) {
      return NextResponse.json({
        success: true,
        attemptId: null,
        answers: [],
        timeTakenSec: 0,
      });
    }

    // 3. Create a brand new attempt
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        completed: false,
        scorePercentage: 0,
        correctCount: 0,
        wrongCount: 0,
        timeTakenSec: 0,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: newAttempt.id,
      answers: [],
      timeTakenSec: 0,
    });
  } catch (error) {
    console.error("Failed to start/retrieve attempt:", error);
    return NextResponse.json({ error: "Failed to initialize quiz attempt" }, { status: 500 });
  }
}
