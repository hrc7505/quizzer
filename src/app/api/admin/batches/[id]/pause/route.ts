import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      data: { status: "PAUSED" },
    });

    return NextResponse.json({
      success: true,
      message: `Batch "${batch.title}" has been paused.`,
    });
  } catch (error) {
    console.error("Failed to pause batch:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
