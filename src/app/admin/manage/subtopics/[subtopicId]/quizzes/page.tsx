import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SubtopicQuizzesManager } from "@/components/data-display/SubtopicQuizzesManager";
import { computeCanonicalQuestionCount } from "@/lib/quiz-routing";

export const dynamic = "force-dynamic";

interface ManageSubtopicQuizzesPageProps {
  params: Promise<{ subtopicId: string }>;
}

export async function generateMetadata({ params }: ManageSubtopicQuizzesPageProps) {
  const { subtopicId } = await params;
  const subtopic = await prisma.topic.findUnique({ where: { id: subtopicId } });
  return {
    title: subtopic ? `${subtopic.title} · Quizzes` : "Manage Quizzes",
    description: "Manage quizzes attached to this subtopic.",
  };
}

/**
 * Server page: /admin/manage/subtopics/[subtopicId]/quizzes
 * Loads the parent Subtopic and its quizzes, plus available quizzes for linking.
 */
export default async function ManageSubtopicQuizzesPage({ params }: ManageSubtopicQuizzesPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { subtopicId } = await params;

  const [rawSubtopic, rawAvailableQuizzes] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: subtopicId },
      include: {
        parentTopics: { select: { id: true, title: true } },
        quizzes: {
          include: {
            topics: { select: { id: true, title: true } },
            questions: {
              select: { id: true, language: true, sourceQuestionId: true, text: true },
            },
            _count: { select: { attempts: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.quiz.findMany({
      where: {
        topics: { none: { id: subtopicId } },
      },
      include: {
        topics: { select: { id: true, title: true } },
        questions: {
          select: { id: true, language: true, sourceQuestionId: true, text: true },
        },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!rawSubtopic) {
    notFound();
  }

  const subtopic = {
    ...rawSubtopic,
    quizzes: rawSubtopic.quizzes.map((quiz) => ({
      ...quiz,
      _count: {
        questions: computeCanonicalQuestionCount(quiz.questions),
        attempts: quiz._count?.attempts || 0,
      },
    })),
  };

  const availableQuizzes = rawAvailableQuizzes.map((quiz) => ({
    ...quiz,
    _count: {
      questions: computeCanonicalQuestionCount(quiz.questions),
      attempts: quiz._count?.attempts || 0,
    },
  }));

  return (
    <div>
      <SubtopicQuizzesManager subtopic={subtopic} availableQuizzes={availableQuizzes} />
    </div>
  );
}
