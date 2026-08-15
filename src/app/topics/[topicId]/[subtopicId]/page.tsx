import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { PageLayout } from "@/components/layouts/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ContentHeader } from "@/components/layouts/ContentHeader";
import { QuizCardGrid } from "@/components/data-display/QuizCardGrid";
import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";

export const revalidate = 60;

interface StandaloneQuizzesPageProps {
  params: Promise<{ topicId: string; subtopicId: string }>;
}

export async function generateStaticParams() {
  const subtopics = await prisma.topic.findMany({
    where: { parentTopics: { some: {} }, exams: { none: {} } },
    include: { parentTopics: { select: { id: true } } }
  });
  return subtopics.map(sub => ({
    topicId: sub.parentTopics[0]?.id ?? "",
    subtopicId: sub.id
  }));
}

export async function generateMetadata({ params }: StandaloneQuizzesPageProps) {
  const { subtopicId } = await params;
  const subtopic = await prisma.topic.findUnique({ where: { id: subtopicId } });
  return {
    title: subtopic ? `${subtopic.title} · Quizzes` : "Quizzes",
    description: subtopic?.description || "Browse quizzes."
  };
}

async function getPageData(topicId: string, subtopicId: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as SessionUser).id : null;

  const [topic, subtopic] = await Promise.all([
    prisma.topic.findUnique({ where: { id: topicId } }),
    prisma.topic.findUnique({
      where: { id: subtopicId },
      include: {
        quizzes: {
          where: { questions: { some: {} } },
          include: { _count: { select: { questions: true } } },
          orderBy: { quizOrder: "asc" }
        }
      }
    })
  ]);

  const attemptsData: Record<string, { lastAttemptId: string | null; completedCount: number }> = {};

  if (userId && subtopic) {
    const quizIds = subtopic.quizzes.map(q => q.id);
    if (quizIds.length > 0) {
      // Fetch last completed attempt and count per quiz for this user
      const attempts = await prisma.quizAttempt.findMany({
        where: { quizId: { in: quizIds }, userId, completed: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, quizId: true },
      });

      // Get counts per quiz
      const counts = await Promise.all(
        quizIds.map(async (qid) => ({
          quizId: qid,
          count: await prisma.quizAttempt.count({
            where: { quizId: qid, userId, completed: true },
          }),
        }))
      );

      // Build map: first entry per quiz is the last attempt
      const seen = new Set<string>();
      for (const a of attempts) {
        if (!seen.has(a.quizId)) {
          seen.add(a.quizId);
          if (!attemptsData[a.quizId]) {
            attemptsData[a.quizId] = { lastAttemptId: a.id, completedCount: 0 };
          } else {
            attemptsData[a.quizId].lastAttemptId = a.id;
          }
        }
      }
      for (const c of counts) {
        if (!attemptsData[c.quizId]) {
          attemptsData[c.quizId] = { lastAttemptId: null, completedCount: c.count };
        } else {
          attemptsData[c.quizId].completedCount = c.count;
        }
      }
    }
  }

  return { topic, subtopic, attemptsData };
}

function StandaloneQuizzesPageClient({ topicId, subtopicId, topic, subtopic, attemptsData }: {
  topicId: string;
  subtopicId: string;
  topic: Awaited<ReturnType<typeof getPageData>>["topic"];
  subtopic: Awaited<ReturnType<typeof getPageData>>["subtopic"];
  attemptsData: Record<string, { lastAttemptId: string | null; completedCount: number }>;
}) {
  if (!topic || !subtopic) {
    return null;
  }

  const breadcrumbItems = [
    { label: "Topics", href: "/exams" },
    { label: topic.title, href: `/topics/${topicId}` },
    { label: subtopic.title }
  ];

  return (
    <PageLayout>
      <Breadcrumbs items={breadcrumbItems} />
      <ContentHeader
        icon={<BookOpen />}
        variant="quiz"
        title={subtopic.title}
        description={subtopic.description}
      />
      <SectionHeading>Quizzes</SectionHeading>
      <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/topics/${topicId}/${subtopicId}`} attemptsData={attemptsData} />
    </PageLayout>
  );
}

export default async function StandaloneTopicQuizzesPage({ params }: StandaloneQuizzesPageProps) {
  const { topicId, subtopicId } = await params;
  const { topic, subtopic, attemptsData } = await getPageData(topicId, subtopicId);

  if (!topic || !subtopic) {
    notFound();
  }

  return <StandaloneQuizzesPageClient topicId={topicId} subtopicId={subtopicId} topic={topic} subtopic={subtopic} attemptsData={attemptsData} />;
}