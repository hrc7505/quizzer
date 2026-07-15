import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { QuizCardGrid } from "@/components/ui/QuizCardGrid";
import { BookOpen24Regular } from "@fluentui/react-icons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

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

async function getPageData(topicId: string, subtopicId: string) {
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
  return { topic, subtopic };
}

function StandaloneQuizzesPageClient({ topicId, subtopicId, topic, subtopic }: {
  topicId: string;
  subtopicId: string;
  topic: Awaited<ReturnType<typeof getPageData>>["topic"];
  subtopic: Awaited<ReturnType<typeof getPageData>>["subtopic"];
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

export default async function StandaloneTopicQuizzesPage({ params }: StandaloneQuizzesPageProps) {
  const { topicId, subtopicId } = await params;
  const { topic, subtopic } = await getPageData(topicId, subtopicId);

  if (!topic || !subtopic) {
    notFound();
  }

  return <StandaloneQuizzesPageClient topicId={topicId} subtopicId={subtopicId} topic={topic} subtopic={subtopic} />;
}
