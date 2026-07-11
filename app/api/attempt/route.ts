import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { quizId, timeTakenSec, answers } = data;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Calculate score
    const totalQuestions = answers.length;
    let correctCount = 0;
    
    for (const ans of answers) {
      if (ans.isCorrect) correctCount++;
    }
    
    const wrongCount = totalQuestions - correctCount;
    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Create Attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        scorePercentage,
        correctCount,
        wrongCount,
        timeTakenSec,
        answers: {
          create: answers.map((a: any) => ({
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer,
            isCorrect: a.isCorrect,
          }))
        }
      }
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error("Failed to submit attempt:", error);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}
