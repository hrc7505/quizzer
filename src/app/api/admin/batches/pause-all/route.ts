import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { topicId } = body as { topicId?: string };

    const whereClause: {
      status: { in: string[] };
      topicId?: string;
    } = {
      status: { in: ["PENDING", "PROCESSING"] },
    };

    if (topicId) {
      whereClause.topicId = topicId;
    }

    const result = await prisma.quizBatch.updateMany({
      where: whereClause,
      data: { status: "PAUSED" },
    });

    return NextResponse.json({
      success: true,
      pausedCount: result.count,
      message: `Paused ${result.count} batch(es).`,
    });
  } catch (error) {
    console.error("Failed to pause all batches:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
