import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureQuizBatchTable, extractQuestionBlocks } from "@/app/api/admin/generate-quiz/route";

/**
 * Counts the number of questions in a batch's rawText using the robust question block extractor.
 */
function countBatchQuestions(rawText?: string | null): number {
  if (!rawText) return 0;
  const blocks = extractQuestionBlocks(rawText);
  if (blocks.length > 0) return blocks.length;
  const optMatches = rawText.match(/(?:\([A-Da-d1-4અ-ડ]\)|[A-Da-dઅ-ડ]\))/gu);
  if (optMatches && optMatches.length > 0) {
    return Math.max(1, Math.round(optMatches.length / 4));
  }
  return 1;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureQuizBatchTable();

    // Auto-recover stale batches that have been in PROCESSING status for more than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await prisma.quizBatch.updateMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: twoMinutesAgo },
      },
      data: {
        status: "FAILED",
        error: "Generation timed out or was interrupted. Click Retry to re-process.",
      },
    }).catch(() => null);

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
      questionCount: countBatchQuestions(b.rawText),
      topicTitle: b.topicId ? topicMap.get(b.topicId) || null : null,
    }));

    return NextResponse.json({ batches: result });
  } catch (error: unknown) {
    console.error("Failed to fetch quiz batches:", error);
    // If the table has not been created yet in the database, return empty array instead of 500
    const errCode = (error as { code?: string })?.code;
    const errMsg = (error as { message?: string })?.message || "";
    if (errCode === "P2021" || errMsg.includes("does not exist")) {
      return NextResponse.json({ batches: [] });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
