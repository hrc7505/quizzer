import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { QuizCardGrid } from "@/components/ui/QuizCardGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { notFound } from "next/navigation";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";

export const dynamic = "force-dynamic";

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Breadcrumbs items={breadcrumbItems} />

        <ContentHeader
          icon={<BookOpen24Regular style={{ color: "white" }} />}
          gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
          title={subtopic.title}
          description={subtopic.description}
        />

        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
          Quizzes
        </h2>
        <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/exams/${examId}/${topicId}/${subtopicId}`} />
      </main>
    </div>
  );
}
