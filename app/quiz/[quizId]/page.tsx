import { prisma } from "@/lib/prisma";
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
          parentTopics: {
            include: {
              exams: true,
            },
          },
          exams: true,
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  // 1. Find a subtopic (a topic linked to the quiz that has a parent topic)
  const subtopic = quiz.topics.find((t) => t.parentTopics.length > 0) || quiz.topics[0];

  if (!subtopic) {
    return notFound();
  }

  const parentTopic = subtopic.parentTopics[0];

  // 2. Check if there's an associated exam
  const exam = parentTopic?.exams[0] || subtopic.exams[0];

  // 3. Perform correct redirect based on the resolved taxonomy path
  if (exam && parentTopic) {
    redirect(`/exams/${exam.id}/${parentTopic.id}/${subtopic.id}/quiz/${quiz.id}`);
  } else if (parentTopic) {
    redirect(`/topics/${parentTopic.id}/${subtopic.id}/quiz/${quiz.id}`);
  } else {
    // Fallback if taxonomy is flat
    redirect(`/topics/${subtopic.id}/${subtopic.id}/quiz/${quiz.id}`);
  }
}
