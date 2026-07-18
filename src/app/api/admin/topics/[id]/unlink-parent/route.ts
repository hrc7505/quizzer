import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        parentTopics: { disconnect: { id } },
      },
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    revalidatePath("/admin/manage/topics");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to unlink subtopic from parent:", error);
    return NextResponse.json({ error: "Failed to unlink subtopic" }, { status: 500 });
  }
}
