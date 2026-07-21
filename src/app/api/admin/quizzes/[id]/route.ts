import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        topics: true,
        questions: {
          orderBy: { id: "asc" }
        }
      }
    });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Failed to fetch quiz details:", error);
    return NextResponse.json({ error: "Failed to fetch quiz details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, quizOrder, topicId, difficulty } = body;
    
    const existing = await prisma.quiz.findUnique({
      where: { id },
      include: { topics: { select: { id: true } } }
    });

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        quizOrder: quizOrder !== undefined && quizOrder !== null && quizOrder !== "" ? parseInt(quizOrder) : undefined,
        difficulty,
        topics: topicId !== undefined ? (topicId ? { set: [{ id: topicId }] } : { set: [] }) : undefined
      }
    });

    revalidatePath("/exams");
    existing?.topics.forEach(t => revalidatePath(`/topics/${t.id}`));
    await revalidateQuizAndRelated(id);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Failed to update quiz:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.quiz.findUnique({
      where: { id },
      include: { topics: { select: { id: true } } }
    });

    await prisma.quiz.delete({ where: { id } });

    revalidatePath("/exams");
    existing?.topics.forEach(t => revalidatePath(`/topics/${t.id}`));
    await revalidateQuizAndRelated(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
