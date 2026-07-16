import { PageLayout } from "@/components/layouts/PageLayout";
import { prisma } from "@/lib/prisma";
import { QuizResults } from "@/components/data-display/QuizResults";
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
              elaboration: true,
              topic: { select: { id: true, title: true } }
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
        elaboration: true,
        topic: { select: { id: true, title: true } }
      }
    });
    attempt.quiz.questions = fallbackQuestions;
  }

  return (
    <PageLayout navMaxWidth="900px" mainMaxWidth="900px">
      <QuizResults attempt={attempt} />
    </PageLayout>
  );
}
