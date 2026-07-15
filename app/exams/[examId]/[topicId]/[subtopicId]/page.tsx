import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { QuizCardGrid } from "@/components/ui/QuizCardGrid";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface QuizzesPageProps {
  params: Promise<{ examId: string; topicId: string; subtopicId: string }>;
}

export async function generateStaticParams() {
  const subtopics = await prisma.topic.findMany({
    where: { parentTopics: { some: {} }, exams: { some: {} } },
    include: {
      parentTopics: { include: { exams: { select: { id: true } } } }
    }
  });
  return subtopics.map(sub => {
    const parent = sub.parentTopics[0];
    const exam = parent?.exams[0];
    return {
      examId: exam?.id ?? "",
      topicId: parent?.id ?? "",
      subtopicId: sub.id
    };
  });
}

interface QuizzesPageProps {
  params: Promise<{ examId: string; topicId: string; subtopicId: string }>;
}

export async function generateMetadata({ params }: QuizzesPageProps) {
  const { subtopicId } = await params;
  const subtopic = await prisma.topic.findUnique({ where: { id: subtopicId } });
  return {
    title: subtopic ? `${subtopic.title} · Quizzes` : "Quizzes",
    description: subtopic?.description || "Browse quizzes."
  };
}

/**
 * Public Subtopic Quizzes list view.
 * Lists all quizzes linked under a specific subtopic.
 * Integrates filtering and infinite scroll pagination.
 */
export default async function TopicQuizzesPage({ params }: QuizzesPageProps) {
  const { examId, topicId, subtopicId } = await params;
  const [exam, topic, subtopic] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
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

  if (!exam || !topic || !subtopic) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Exams", href: "/exams" },
    { label: exam.title, href: `/exams/${examId}` },
    { label: topic.title, href: `/exams/${examId}/${topicId}` },
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
      <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/exams/${examId}/${topicId}/${subtopicId}`} />
    </PageLayout>
  );
}
