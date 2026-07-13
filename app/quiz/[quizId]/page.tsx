import { prisma } from "@/lib/prisma";
import { resolveQuizRoute } from "@/lib/quiz-routing";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface DirectQuizPlayPageProps {
  params: Promise<{
    quizId: string;
  }>;
}

/**
 * DirectQuizPlayPage Server Component. Resolves the exam/topic/subtopic hierarchy
 * for a given quiz ID and redirects to the correct nested URL structure.
 */
export default async function DirectQuizPlayPage({ params }: DirectQuizPlayPageProps) {
  const { quizId } = await params;

  // Query the quiz and resolve its relations to find exam/topic mapping
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: {
        include: {
          exams: true,
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  const canonicalPath = await resolveQuizRoute(quizId);

  if (!canonicalPath) {
    return notFound();
  }

  redirect(canonicalPath);
}
