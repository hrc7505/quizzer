import { QuizClient } from "./QuizClient";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface StandaloneQuizPageProps {
  params: Promise<{
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

export default async function StandaloneQuizPage({ params }: StandaloneQuizPageProps) {
  const { subtopicId, quizId } = await params;
  const quiz = await getQuizData(quizId, subtopicId);

  if (!quiz) {
    notFound();
  }

  return <QuizClient quiz={quiz} />;
}
