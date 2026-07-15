import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { BookOpen24Regular } from "@fluentui/react-icons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface StandaloneSubtopicsPageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateMetadata({ params }: StandaloneSubtopicsPageProps) {
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  return {
    title: topic ? `${topic.title} · Subtopics` : "Subtopics",
    description: topic?.description || "Browse subtopics."
  };
}

async function getPageData(topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        include: { _count: { select: { quizzes: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  return topic;
}

function StandaloneSubtopicsPageClient({ topicId, topic }: {
  topicId: string;
  topic: Awaited<ReturnType<typeof getPageData>>;
}) {
  if (!topic) {
    return null;
  }

  const subtopicItems = topic.subtopics.map(sub => ({
    id: sub.id,
    title: sub.title,
    description: sub.description,
    href: `/topics/${topicId}/${sub.id}`,
    meta: `${sub._count.quizzes} Quizzes`
  }));

  const breadcrumbItems = [
    { label: "Topics", href: "/exams" },
    { label: topic.title }
  ];

  return (
    <PageLayout>
      <Breadcrumbs items={breadcrumbItems} />
      <ContentHeader
        icon={<BookOpen24Regular />}
        variant="topic"
        title={topic.title}
        description={topic.description}
      />
      <SectionHeading>Subtopics</SectionHeading>
      <DirectoryCardList items={subtopicItems} itemLabel="subtopics" searchPlaceholder="Search subtopics..." />
    </PageLayout>
  );
}

export default async function StandaloneTopicSubtopicsPage({ params }: StandaloneSubtopicsPageProps) {
  const { topicId } = await params;
  const topic = await getPageData(topicId);

  if (!topic) {
    notFound();
  }

  return <StandaloneSubtopicsPageClient topicId={topicId} topic={topic} />;
}
