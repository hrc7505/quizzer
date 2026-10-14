import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";

/**
 * POST /api/user/attempts/clear
 * Deletes all quiz attempts and associated answers belonging to the authenticated user.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    // Delete all quiz attempts for this user (answers cascade delete)
    const deleteResult = await prisma.quizAttempt.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error("Error clearing user attempts:", error);
    return NextResponse.json({ error: "Failed to clear quiz attempts" }, { status: 500 });
  }
}
