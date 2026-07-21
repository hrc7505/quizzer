import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ lastAttemptId: null, completedCount: 0 });
    }

    const userId = (session.user as SessionUser).id;

    const [lastAttempt, completedCount] = await Promise.all([
      prisma.quizAttempt.findFirst({
        where: { quizId, userId, completed: true },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
      prisma.quizAttempt.count({ where: { quizId, userId, completed: true } }),
    ]);

    return NextResponse.json({
      lastAttemptId: lastAttempt?.id || null,
      completedCount,
    });
  } catch (error) {
    console.error("Failed to fetch last attempt:", error);
    return NextResponse.json({ error: "Failed to fetch last attempt" }, { status: 500 });
  }
}