import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

/**
 * Public Standalone Main Topic Subtopics list view.
 * Lists all subtopics nested under a standalone main topic.
 */
export default async function StandaloneTopicSubtopicsPage({ params }: StandaloneSubtopicsPageProps) {
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        include: { _count: { select: { quizzes: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!topic) {
    notFound();
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
