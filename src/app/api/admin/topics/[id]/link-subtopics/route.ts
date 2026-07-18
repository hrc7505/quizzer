import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { subtopicIds } = await req.json();

    if (!Array.isArray(subtopicIds)) {
      return NextResponse.json({ error: "subtopicIds must be an array" }, { status: 400 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        subtopics: { connect: subtopicIds.map((sid: string) => ({ id: sid })) },
      },
    });

    revalidatePath("/topics");
    revalidatePath(`/topics/${id}`);
    revalidatePath("/admin/manage/topics");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Failed to link subtopics:", error);
    return NextResponse.json({ error: "Failed to link subtopics" }, { status: 500 });
  }
}
