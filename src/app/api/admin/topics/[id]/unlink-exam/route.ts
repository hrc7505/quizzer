import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        exams: { disconnect: { id: examId } },
      },
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    revalidatePath("/exams");
    revalidatePath(`/exams/${examId}`);
    revalidatePath("/admin/manage/exams");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to unlink topic from exam:", error);
    return NextResponse.json({ error: "Failed to unlink topic" }, { status: 500 });
  }
}
