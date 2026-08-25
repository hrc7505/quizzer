import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        topics: true,
        questions: {
          select: { language: true, text: true },
        },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { quizOrder: "asc" },
    });

    const formattedQuizzes = quizzes.map((quiz) => {
      const languages = Array.from(
        new Set(
          quiz.questions.map((q) => {
            if (q.language) return q.language;
            if (/[\u0A80-\u0AFF]/.test(q.text)) return "gu";
            if (/[\u0900-\u097F]/.test(q.text)) return "hi";
            return "en";
          })
        )
      );

      const enCount = quiz.questions.filter(
        (q) =>
          q.language === "en" ||
          (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text))
      ).length;
      const guCount = quiz.questions.filter(
        (q) => q.language === "gu" || /[\u0A80-\u0AFF]/.test(q.text)
      ).length;
      const hiCount = quiz.questions.filter(
        (q) => q.language === "hi" || /[\u0900-\u097F]/.test(q.text)
      ).length;

      const distinctCount = Math.max(enCount, guCount, hiCount, quiz.questions.length > 0 ? 1 : 0);

      return {
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        quizOrder: quiz.quizOrder,
        language: quiz.language,
        availableLanguages: languages.length > 0 ? languages : ["en"],
        topics: quiz.topics,
        _count: {
          questions: distinctCount,
          attempts: quiz._count?.attempts || 0,
        },
      };
    });

    return NextResponse.json(formattedQuizzes);
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
      const maxOrder = await prisma.quiz.findFirst({
        where: topicId ? { topics: { some: { id: topicId } } } : undefined,
        orderBy: { quizOrder: "desc" },
        select: { quizOrder: true }
      });
      order = (maxOrder?.quizOrder || 0) + 1;
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
    await revalidateQuizAndRelated(quiz.id);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Failed to create quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
