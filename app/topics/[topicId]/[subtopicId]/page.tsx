import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { QuizCardGrid } from "@/components/ui/QuizCardGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { notFound } from "next/navigation";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ padding: '40px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
        <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/topics/${topicId}/${subtopicId}`} />
      </main>
    </div>
  );
}
