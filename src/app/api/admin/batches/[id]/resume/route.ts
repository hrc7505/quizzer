import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { after } from "next/server";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processBatchById } from "@/app/api/admin/generate-quiz/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const batch = await prisma.quizBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.quizBatch.update({
      where: { id },
      data: { status: "PENDING", error: null },
    });

    // Resume execution in background
    after(async () => {
      await processBatchById(id);
    });

    return NextResponse.json({
      success: true,
      message: `Batch "${batch.title}" resumed. Generation running in background.`,
    });
  } catch (error) {
    console.error("Failed to resume batch:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
