import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, description, examId, parentId, subtopicIds, quizIds } = await req.json();
    
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { exams: { select: { id: true } }, parentTopics: { select: { id: true } } }
    });

    const topic = await prisma.topic.update({
      where: { id },
      data: { 
        title, 
        description, 
        exams: examId !== undefined ? (examId ? { set: [{ id: examId }] } : { set: [] }) : undefined,
        parentTopics: parentId !== undefined ? (parentId ? { set: [{ id: parentId }] } : { set: [] }) : undefined,
        subtopics: subtopicIds && Array.isArray(subtopicIds) ? {
          set: subtopicIds.map((sid: string) => ({ id: sid }))
        } : undefined,
        quizzes: quizIds && Array.isArray(quizIds) ? {
          set: quizIds.map((qid: string) => ({ id: qid }))
        } : undefined
      }
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    existing?.exams.forEach(e => revalidatePath(`/exams/${e.id}`));
    existing?.parentTopics.forEach(p => revalidatePath(`/topics/${p.id}`));
    revalidatePath("/exams");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to update topic:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { exams: { select: { id: true } }, parentTopics: { select: { id: true } } }
    });

    await prisma.topic.delete({ where: { id } });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    existing?.exams.forEach(e => revalidatePath(`/exams/${e.id}`));
    existing?.parentTopics.forEach(p => revalidatePath(`/topics/${p.id}`));
    revalidatePath("/exams");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete topic:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
