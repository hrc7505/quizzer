import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { QuizResults } from "@/components/ui/QuizResults";
import { notFound } from "next/navigation";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          topics: true,
          questions: {
            select: {
              id: true,
              text: true,
              options: true,
              correctAnswer: true,
              hint: true,
              description: true,
              elaboration: true
            }
          },
        }
      },
      answers: true,
    }
  });

  if (!attempt) {
    return notFound();
  }

  // Fallback: If no questions are directly linked to the Quiz,
  // load all questions connected to the quiz's parent topics.
  if (attempt.quiz.questions.length === 0) {
    const topicIds = attempt.quiz.topics.map(t => t.id);
    const fallbackQuestions = await prisma.question.findMany({
      where: { topicId: { in: topicIds } },
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswer: true,
        hint: true,
        description: true,
        elaboration: true
      }
    });
    attempt.quiz.questions = fallbackQuestions;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar maxWidth="900px" />
      <main style={{ padding: '24px 16px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <QuizResults attempt={attempt} />
      </main>
    </div>
  );
}
