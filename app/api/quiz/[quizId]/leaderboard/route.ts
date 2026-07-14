import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Handles GET requests to fetch the top 10 unique rankers for a quiz.
 * Ranks by score percentage (descending), then time taken (ascending), then date (ascending).
 */
type LeaderboardEntry = {
  userId: string;
  name: string;
  email: string | null | undefined;
  image: string | null | undefined;
  scorePercentage: number | null;
  timeTakenSec: number | null;
  createdAt: Date;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    // Fetch all completed attempts for the quiz with user details
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        completed: true,
        user: { isNot: null }, // Only list logged-in users on the leaderboard
      },
      orderBy: [
        { scorePercentage: "desc" },
        { timeTakenSec: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Filter to retain only the best unique attempt per user
    const leaderboard: LeaderboardEntry[] = [];
    const seenUsers = new Set<string>();

    for (const att of attempts) {
      if (!att.user) continue;
      if (!seenUsers.has(att.user.id)) {
        seenUsers.add(att.user.id);
        leaderboard.push({
          userId: att.user.id,
          name: att.user.name || att.user.email?.split("@")[0] || "Anonymous User",
          email: att.user.email,
          image: att.user.image,
          scorePercentage: att.scorePercentage,
          timeTakenSec: att.timeTakenSec,
          createdAt: att.createdAt,
        });

        if (leaderboard.length === 10) {
          break;
        }
      }
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
