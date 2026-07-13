import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { QuizWizard } from "@/components/ui/QuizWizard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface StandaloneQuizPageProps {
  params: Promise<{
    topicId: string;
    subtopicId: string;
    quizId: string;
  }>;
}

/**
 * Standalone Topic Quiz play page.
 * Loads the quiz and executes the wizard. Supports topic question fallback.
 */
export default async function StandaloneQuizPage({ params }: StandaloneQuizPageProps) {
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

  // Fallback: If no questions are directly linked to the Quiz,
  // fetch all questions linked to this specific subtopic.
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar maxWidth="1200px" />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <QuizWizard quiz={quizWithQuestions} />
      </main>
    </div>
  );
}
