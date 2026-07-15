import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface SubtopicsPageProps {
  params: Promise<{ examId: string; topicId: string }>;
}

export async function generateStaticParams() {
  const topics = await prisma.topic.findMany({
    where: { exams: { some: {} } },
    include: { exams: { select: { id: true } } }
  });
  return topics.flatMap(topic =>
    topic.exams.map(exam => ({ examId: exam.id, topicId: topic.id }))
  );
}

interface SubtopicsPageProps {
  params: Promise<{ examId: string; topicId: string }>;
}

export async function generateMetadata({ params }: SubtopicsPageProps) {
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  return {
    title: topic ? `${topic.title} · Subtopics` : "Subtopics",
    description: topic?.description || "Browse subtopics."
  };
}

/**
 * Public Main Topic Subtopics list view.
 * Lists all subtopics nested under a specific main topic.
 */
export default async function TopicSubtopicsPage({ params }: SubtopicsPageProps) {
  const { examId, topicId } = await params;
  const [exam, topic] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
    prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subtopics: {
          include: { _count: { select: { quizzes: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    })
  ]);

  if (!exam || !topic) {
    notFound();
  }

  const subtopicItems = topic.subtopics.map(sub => ({
    id: sub.id,
    title: sub.title,
    description: sub.description,
    href: `/exams/${examId}/${topicId}/${sub.id}`,
    meta: `${sub._count.quizzes} Quizzes`
  }));

  const breadcrumbItems = [
    { label: "Exams", href: "/exams" },
    { label: exam.title, href: `/exams/${examId}` },
    { label: topic.title }
  ];

  return (
    <PageLayout>
      <Breadcrumbs items={breadcrumbItems} />

      <ContentHeader
        icon={<BookOpen24Regular />}
        variant="subtopic"
        title={topic.title}
        description={topic.description}
      />

      <SectionHeading>Subtopics</SectionHeading>
      <DirectoryCardList items={subtopicItems} itemLabel="subtopics" searchPlaceholder="Search subtopics..." />
    </PageLayout>
  );
}
