import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");

    if (!parentId) {
      return NextResponse.json({ error: "parentId is required" }, { status: 400 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        parentTopics: { disconnect: { id: parentId } },
      },
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    revalidatePath(`/topics/${parentId}`);
    revalidatePath("/admin/manage/topics");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to unlink subtopic from parent:", error);
    return NextResponse.json({ error: "Failed to unlink subtopic" }, { status: 500 });
  }
}
