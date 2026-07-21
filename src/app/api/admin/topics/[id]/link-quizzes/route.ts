import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { quizIds } = await req.json();

    if (!Array.isArray(quizIds)) {
      return NextResponse.json({ error: "quizIds must be an array" }, { status: 400 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        quizzes: { set: quizIds.map((qid: string) => ({ id: qid })) },
      },
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    revalidatePath("/admin/manage/topics");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to link quizzes:", error);
    return NextResponse.json({ error: "Failed to link quizzes" }, { status: 500 });
  }
}
