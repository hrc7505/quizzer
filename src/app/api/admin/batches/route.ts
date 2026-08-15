import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    const status = searchParams.get("status");

    const whereClause: { topicId?: string; status?: string } = {};
    if (topicId) whereClause.topicId = topicId;
    if (status) whereClause.status = status;

    const batches = await prisma.quizBatch.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Attach topic titles if topicId exists
    const topicIds = Array.from(new Set(batches.map((b) => b.topicId).filter(Boolean))) as string[];
    const topics = topicIds.length > 0
      ? await prisma.topic.findMany({
          where: { id: { in: topicIds } },
          select: { id: true, title: true },
        })
      : [];
    const topicMap = new Map(topics.map((t) => [t.id, t.title]));

    const result = batches.map((b) => ({
      ...b,
      topicTitle: b.topicId ? topicMap.get(b.topicId) || null : null,
    }));

    return NextResponse.json({ batches: result });
  } catch (error) {
    console.error("Failed to fetch quiz batches:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
