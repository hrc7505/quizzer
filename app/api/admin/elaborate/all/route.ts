import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const questions = await prisma.question.findMany({
      where: {
        elaboration: { not: null },
        topic: { isNot: { title: INTERNAL_TOPIC_TITLE } }
      },
      select: {
        id: true,
        text: true,
        correctAnswer: true,
        elaboration: true,
        topic: { select: { id: true, title: true } },
        quiz: { select: { id: true, title: true, difficulty: true } }
      },
      orderBy: { topic: { title: "asc" } }
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Fetch all elaborations error:", error);
    return NextResponse.json({ error: "Failed to fetch elaborations" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const result = await prisma.question.updateMany({
      where: { elaboration: { not: null } },
      data: { elaboration: null }
    });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk delete elaborations error:", error);
    return NextResponse.json({ error: "Failed to bulk delete elaborations" }, { status: 500 });
  }
}
