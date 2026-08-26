import { prisma } from "@/lib/prisma";
import { QuizManager } from "@/components/data-display/QuizManager";

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
  const [quizzes, topics] = await Promise.all([
    prisma.quiz.findMany({
      include: {
        topics: {
          select: { id: true, title: true }
        },
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.topic.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return <QuizManager quizzes={quizzes} topics={topics} />;
}
