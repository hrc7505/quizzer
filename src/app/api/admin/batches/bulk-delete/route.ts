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
    const { ids, all, topicId, status } = body as {
      ids?: string[];
      all?: boolean;
      topicId?: string;
      status?: string;
    };

    if (all) {
      const whereClause: { topicId?: string; status?: string } = {};
      if (topicId) whereClause.topicId = topicId;
      if (status) whereClause.status = status;

      const result = await prisma.quizBatch.deleteMany({
        where: whereClause,
      });

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Deleted ${result.count} batch(es).`,
      });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.quizBatch.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Deleted ${result.count} selected batch(es).`,
      });
    }

    return NextResponse.json({ error: "Missing ids or all flag" }, { status: 400 });
  } catch (error) {
    console.error("Bulk delete batches failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
