import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
