import { notFound } from "next/navigation";

import { QuizClient } from "@/app/exams/[examId]/[topicId]/[subtopicId]/quiz/[quizId]/QuizClient";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

interface QuizPageProps {
  params: Promise<{
    examId: string;
    topicId: string;
    subtopicId: string;
    quizId: string;
  }>;
}

async function getQuizData(quizId: string, subtopicId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: true,
      questions: true,
    }
  });

  if (!quiz) {
    return null;
  }

  let questions = quiz.questions;
  if (questions.length === 0) {
    questions = await prisma.question.findMany({
      where: { topicId: subtopicId }
    });
  }

  return {
    ...quiz,
    questions
  };
}

export default async function ExamQuizPage({ params }: QuizPageProps) {
  const { subtopicId, quizId } = await params;
  const quiz = await getQuizData(quizId, subtopicId);

  if (!quiz) {
    notFound();
  }

  return <QuizClient quiz={quiz} />;
}
