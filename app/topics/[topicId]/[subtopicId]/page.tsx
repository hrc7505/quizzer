import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { QuizCardGrid } from "@/components/ui/QuizCardGrid";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface StandaloneQuizzesPageProps {
  params: Promise<{ topicId: string; subtopicId: string }>;
}

export async function generateMetadata({ params }: StandaloneQuizzesPageProps) {
  const { subtopicId } = await params;
  const subtopic = await prisma.topic.findUnique({ where: { id: subtopicId } });
  return {
    title: subtopic ? `${subtopic.title} · Quizzes` : "Quizzes",
    description: subtopic?.description || "Browse quizzes."
  };
}

/**
 * Public Standalone Subtopic Quizzes list view.
 * Lists all quizzes linked under a standalone subtopic.
 * Integrates filtering and infinite scroll pagination.
 */
export default async function StandaloneTopicQuizzesPage({ params }: StandaloneQuizzesPageProps) {
  const { topicId, subtopicId } = await params;
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

  if (!topic || !subtopic) {
    notFound();
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
        icon={<BookOpen24Regular />}
        variant="quiz"
        title={subtopic.title}
        description={subtopic.description}
      />

      <SectionHeading>Quizzes</SectionHeading>
      <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/topics/${topicId}/${subtopicId}`} />
    </PageLayout>
  );
}
