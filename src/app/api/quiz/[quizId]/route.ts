import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const url = new URL(req.url);
    const requestedLang = url.searchParams.get("lang");

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        topics: true,
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Determine available languages in this quiz
    const availableLanguages = Array.from(
      new Set(
        quiz.questions.map((q) => {
          if (q.language) return q.language;
          if (/[\u0A80-\u0AFF]/.test(q.text)) return "gu";
          if (/[\u0900-\u097F]/.test(q.text)) return "hi";
          return "en";
        })
      )
    );

    // If a specific language is requested, filter questions
    let filteredQuestions = quiz.questions;
    if (requestedLang && availableLanguages.includes(requestedLang)) {
      filteredQuestions = quiz.questions.filter((q) => {
        const qLang =
          q.language ||
          (/[\u0A80-\u0AFF]/.test(q.text)
            ? "gu"
            : /[\u0900-\u097F]/.test(q.text)
            ? "hi"
            : "en");
        return qLang === requestedLang;
      });
    }

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: filteredQuestions,
        availableLanguages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
