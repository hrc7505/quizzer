import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { TopicSubtopicsManager } from "@/components/data-display/TopicSubtopicsManager";

export const dynamic = "force-dynamic";

interface ManageTopicSubtopicsPageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateMetadata({ params }: ManageTopicSubtopicsPageProps) {
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  return {
    title: topic ? `${topic.title} · Sub Topics` : "Manage Sub Topics",
    description: "Manage nested subtopics for this main topic.",
  };
}

/**
 * Server page: /admin/manage/topics/[topicId]/subtopics
 * Loads the parent Main Topic and its nested subtopics, plus available subtopics for linking.
 */
export default async function ManageTopicSubtopicsPage({ params }: ManageTopicSubtopicsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { topicId } = await params;

  const [topic, availableSubtopics] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        exams: { select: { id: true, title: true } },
        parentTopics: { select: { id: true, title: true } },
        subtopics: {
          include: {
            quizzes: { select: { id: true, title: true } },
            _count: { select: { quizzes: true, questions: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.topic.findMany({
      where: {
        id: { not: topicId },
        parentTopics: { none: { id: topicId } },
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!topic) {
    notFound();
  }

  return (
    <div>
      <TopicSubtopicsManager topic={topic} availableSubtopics={availableSubtopics} />
    </div>
  );
}
