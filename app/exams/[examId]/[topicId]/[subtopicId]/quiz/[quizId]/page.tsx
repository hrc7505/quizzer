import { PageLayout } from "@/components/ui/PageLayout";
import { prisma } from "@/lib/prisma";
import { QuizWizard } from "@/components/ui/QuizWizard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface QuizPageProps {
  params: Promise<{
    examId: string;
    topicId: string;
    subtopicId: string;
    quizId: string;
  }>;
}

/**
 * Nested Exam Quiz play page.
 * Loads the quiz and executes the wizard. Supports topic question fallback.
 */
export default async function ExamQuizPage({ params }: QuizPageProps) {
  const { subtopicId, quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: true,
      questions: true,
    }
  });

  if (!quiz) {
    return notFound();
  }

  let questions = quiz.questions;
  if (questions.length === 0) {
    questions = await prisma.question.findMany({
      where: { topicId: subtopicId }
    });
  }

  const quizWithQuestions = {
    ...quiz,
    questions
  };

  return (
    <PageLayout variant="admin" navMaxWidth="1200px" mainMaxWidth="1200px">
      <QuizWizard quiz={quizWithQuestions} />
    </PageLayout>
  );
}
