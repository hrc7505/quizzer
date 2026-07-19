import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

/**
 * PUT /api/admin/questions/[id]
 * Updates an existing question's properties.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, options, correctAnswer, hint, description } = body;

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { quiz: { include: { topics: { include: { exams: { select: { id: true } } } } } } }
    });

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

    if (existing?.quiz?.topics[0]) {
      revalidatePath(`/topics/${existing.quiz.topics[0].id}`, "page");
      existing.quiz.topics[0].exams.forEach(e => revalidatePath(`/exams/${e.id}`, "page"));
    }
    if (existing?.quizId) {
      await revalidateQuizAndRelated(existing.quizId);
    }
    revalidatePath("/exams", "page");
    revalidatePath("/deep-dives", "page");

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

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { quiz: { include: { topics: { include: { exams: { select: { id: true } } } } } } }
    });

    await prisma.question.delete({
      where: { id }
    });

    if (existing?.quiz?.topics[0]) {
      revalidatePath(`/topics/${existing.quiz.topics[0].id}`, "page");
      existing.quiz.topics[0].exams.forEach(e => revalidatePath(`/exams/${e.id}`, "page"));
    }
    if (existing?.quizId) {
      await revalidateQuizAndRelated(existing.quizId);
    }
    revalidatePath("/exams", "page");
    revalidatePath("/deep-dives", "page");

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting question:", e);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
