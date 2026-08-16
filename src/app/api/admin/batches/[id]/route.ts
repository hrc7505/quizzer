import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.quizBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Batch removed" });
  } catch (error) {
    console.error("Failed to delete batch:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
