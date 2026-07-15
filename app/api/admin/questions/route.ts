import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * GET /api/admin/questions
 * Fetches all questions, including parent quiz and topic.
 */
export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        quiz: { select: { id: true, title: true } },
        topic: { select: { id: true, title: true } }
      },
      orderBy: { id: "desc" }
    });
    return NextResponse.json(questions);
  } catch (e) {
    console.error("Error fetching questions list:", e);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

/**
 * POST /api/admin/questions
 * Creates a new question linked to a specific quiz.
 * Automatically resolves the required database relation to a Topic.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quizId, text, options, correctAnswer, hint, description } = body;

    if (!quizId || !text || !options || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { topics: true }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let topicId = quiz.topics[0]?.id;
    if (!topicId) {
      let fallbackTopic = await prisma.topic.findFirst({
        where: { title: "General Questions" }
      });
      if (!fallbackTopic) {
        fallbackTopic = await prisma.topic.create({
          data: { title: "General Questions" }
        });
      }
      topicId = fallbackTopic.id;
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        topicId,
        text,
        options,
        correctAnswer,
        hint: hint || "",
        description: description || ""
      }
    });

    if (quiz.topics[0]) {
      revalidatePath(`/topics/${quiz.topics[0].id}`);
      const topic = await prisma.topic.findUnique({
        where: { id: quiz.topics[0].id },
        include: { exams: { select: { id: true } } }
      });
      topic?.exams.forEach(e => revalidatePath(`/exams/${e.id}`));
    }
    revalidatePath("/exams");

    return NextResponse.json(question);
  } catch (e) {
    console.error("Error creating question:", e);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
