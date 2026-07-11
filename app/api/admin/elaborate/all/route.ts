import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/elaborate/all
 * Returns all questions that have a saved elaboration, along with topic + quiz context.
 * Used by both the public deep-dives library and the admin management page.
 */
export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      where: { elaboration: { not: null } },
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

/**
 * DELETE /api/admin/elaborate/all
 * Bulk-clears ALL saved elaborations from the database.
 * Admin-only action — used from the manage page.
 */
export async function DELETE() {
  try {
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
