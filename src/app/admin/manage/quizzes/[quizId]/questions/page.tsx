import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { AdminQuizQuestionsManager } from "@/components/data-display/AdminQuizQuestionsManager";

export const dynamic = "force-dynamic";

interface ManageQuizQuestionsPageProps {
  params: Promise<{ quizId: string }>;
}

export async function generateMetadata({ params }: ManageQuizQuestionsPageProps) {
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  return {
    title: quiz ? `Manage Questions · ${quiz.title}` : "Manage Questions",
    description: "Manage questions for this quiz."
  };
}

/**
 * Manage Quiz Questions server-side page.
 * Loads the quiz and its questions, then renders the AdminQuizQuestionsManager component.
 */
export default async function ManageQuizQuestionsPage({ params }: ManageQuizQuestionsPageProps) {
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { id: "asc" }
      },
      topics: {
        select: { id: true, title: true }
      }
    }
  });

  if (!quiz) {
    notFound();
  }

  return (
    <div>
      <AdminQuizQuestionsManager quiz={quiz} />
    </div>
  );
}
