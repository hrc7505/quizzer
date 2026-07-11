import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/questions/[id]
 * Updates an existing question's properties.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, options, correctAnswer, hint, description } = body;

    const question = await prisma.question.update({
      where: { id },
      data: {
        text,
        options,
        correctAnswer,
        hint,
        description
      }
    });

    return NextResponse.json(question);
  } catch (e) {
    console.error("Error updating question:", e);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/questions/[id]
 * Permanently deletes a question from the database.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.question.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting question:", e);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
