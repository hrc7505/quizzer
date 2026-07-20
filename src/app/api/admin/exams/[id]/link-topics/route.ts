import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { topicIds } = await req.json();

    if (!Array.isArray(topicIds)) {
      return NextResponse.json({ error: "topicIds must be an array" }, { status: 400 });
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        topics: { connect: topicIds.map((tid: string) => ({ id: tid })) },
      },
    });

    revalidatePath("/exams");
    revalidatePath(`/exams/${id}`);
    revalidatePath("/admin/manage/exams");

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Failed to link topics:", error);
    return NextResponse.json({ error: "Failed to link topics" }, { status: 500 });
  }
}
