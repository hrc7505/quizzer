import { prisma } from "@/lib/prisma";
import { QuizManager } from "@/components/data-display/QuizManager";
import { computeCanonicalQuestionCount } from "@/lib/quiz-routing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Quizzes · Admin",
  description: "Create, edit, link, unlink, and delete quizzes."
};

/**
 * Admin quiz management page.
 * Fetches all quizzes and available topics server-side for pre-population.
 */
export default async function ManageQuizzesPage() {
  const [rawQuizzes, topics] = await Promise.all([
    prisma.quiz.findMany({
      include: {
        topics: {
          select: { id: true, title: true }
        },
        questions: {
          select: { id: true, language: true, sourceQuestionId: true, text: true }
        },
        _count: { select: { attempts: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.topic.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const quizzes = rawQuizzes.map((quiz) => ({
    ...quiz,
    _count: {
      questions: computeCanonicalQuestionCount(quiz.questions),
      attempts: quiz._count?.attempts || 0,
    },
  }));

  return <QuizManager quizzes={quizzes} topics={topics} />;
}
