import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        topics: {
          include: {
            subtopics: { select: { id: true, title: true }, orderBy: { createdAt: "desc" } },
            quizzes: { select: { id: true, title: true }, orderBy: { createdAt: "desc" } },
            _count: { select: { subtopics: true, quizzes: true, questions: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Failed to fetch exam:", error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, description, topicIds } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const exam = await prisma.exam.update({
      where: { id },
      data: { 
        title, 
        description,
        topics: topicIds && Array.isArray(topicIds) ? {
          set: topicIds.map((tid: string) => ({ id: tid }))
        } : undefined
      }
    });

    revalidatePath("/exams");
    revalidatePath(`/exams/${id}`);

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Failed to update exam:", error);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Disconnect all linked topics first before deleting the exam
    await prisma.exam.update({
      where: { id },
      data: { topics: { set: [] } }
    });

    await prisma.exam.delete({ where: { id } });

    revalidatePath("/exams");
    revalidatePath(`/exams/${id}`);
    revalidatePath("/admin/manage/exams");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
