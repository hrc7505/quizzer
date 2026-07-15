import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { BookOpen24Regular } from "@fluentui/react-icons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface ExamPageProps {
  params: Promise<{ examId: string }>;
}

export async function generateMetadata({ params }: ExamPageProps) {
  const { examId } = await params;
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  return {
    title: exam ? `${exam.title} · Main Topics` : "Exam Topics",
    description: exam?.description || "Browse main topics."
  };
}

async function getExamData(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      topics: {
        include: {
          _count: { select: { quizzes: true, subtopics: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  return exam;
}

function ExamTopicsClient({ exam, examId }: { exam: Awaited<ReturnType<typeof getExamData>>, examId: string }) {
  const topicItems = exam?.topics.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    href: `/exams/${examId}/${t.id}`,
    meta: `${t._count.subtopics} Sub Topics`
  })) ?? [];

  const breadcrumbItems = [
    { label: "Exams", href: "/exams" },
    { label: exam!.title }
  ];

  return (
    <PageLayout>
      <Breadcrumbs items={breadcrumbItems} />
      <ContentHeader
        icon={<BookOpen24Regular />}
        variant="topic"
        title={exam!.title}
        description={exam!.description}
      />
      <SectionHeading>Main Topics</SectionHeading>
      <DirectoryCardList items={topicItems} itemLabel="main topics" searchPlaceholder="Search main topics..." />
    </PageLayout>
  );
}

export default async function ExamTopicsPage({ params }: ExamPageProps) {
  const { examId } = await params;
  const exam = await getExamData(examId);

  if (!exam) {
    notFound();
  }

  return <ExamTopicsClient exam={exam} examId={examId} />;
}
