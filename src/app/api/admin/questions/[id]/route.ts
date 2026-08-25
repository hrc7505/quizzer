import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";
import { sanitizeQuestionText, stripNullBytes } from "@/lib/format";

/**
 * PUT /api/admin/questions/[id]
 * Updates an existing question's properties.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { text, imageUrl, invertInDark, options, correctAnswer, hint, description, language } = body;

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { quiz: { include: { topics: { include: { exams: { select: { id: true } } } } } } }
    });

    const question = await prisma.question.update({
      where: { id },
      data: {
        language: language !== undefined ? language : undefined,
        text: text !== undefined ? sanitizeQuestionText(text) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
        invertInDark: typeof invertInDark === "boolean" ? invertInDark : undefined,
        options: Array.isArray(options) ? options.map((opt: unknown) => stripNullBytes(String(opt))) : undefined,
        correctAnswer: correctAnswer !== undefined ? stripNullBytes(correctAnswer) : undefined,
        hint: hint !== undefined ? stripNullBytes(hint) : undefined,
        description: description !== undefined ? stripNullBytes(description) : undefined
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
    revalidateTag("deep-dives", { expire: 0 });

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
    revalidateTag("deep-dives", { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting question:", e);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
