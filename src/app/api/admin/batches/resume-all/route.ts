import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { after } from "next/server";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processBatchById } from "@/app/api/admin/generate-quiz/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { topicId } = body as { topicId?: string };

    const whereClause: {
      status: string;
      topicId?: string;
    } = {
      status: "PAUSED",
    };

    if (topicId) {
      whereClause.topicId = topicId;
    }

    const pausedBatches = await prisma.quizBatch.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (pausedBatches.length === 0) {
      return NextResponse.json({
        success: true,
        resumedCount: 0,
        message: "No paused batches to resume.",
      });
    }

    await prisma.quizBatch.updateMany({
      where: { id: { in: pausedBatches.map((b) => b.id) } },
      data: { status: "PENDING", error: null },
    });

    // Execute background batch processing
    after(async () => {
      for (const b of pausedBatches) {
        const current = await prisma.quizBatch.findUnique({ where: { id: b.id } });
        if (!current || current.status === "PAUSED") continue;
        await processBatchById(b.id);
        await new Promise((r) => setTimeout(r, 1500));
      }
    });

    return NextResponse.json({
      success: true,
      resumedCount: pausedBatches.length,
      message: `Resumed ${pausedBatches.length} batch(es) in background.`,
    });
  } catch (error) {
    console.error("Failed to resume all batches:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
