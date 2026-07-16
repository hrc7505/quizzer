import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        topics: true,
        _count: { select: { questions: true } }
      },
      orderBy: { quizOrder: "asc" }
    });
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topicId, title, quizOrder, difficulty } = body;
    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    let order = quizOrder;
    if (order === undefined || order === null || isNaN(parseInt(order))) {
      order = 1;
    } else {
      order = parseInt(order);
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        difficulty: difficulty || "Medium",
        quizOrder: order,
        topics: topicId ? { connect: { id: topicId } } : undefined
      }
    });

    revalidatePath("/exams");
    if (topicId) revalidatePath(`/topics/${topicId}`);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Failed to create quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
