import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { notFound } from "next/navigation";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";

export const dynamic = "force-dynamic";

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

/**
 * Public Exam Main Topics list view.
 * Lists all main topics connected to a specific exam.
 */
export default async function ExamTopicsPage({ params }: ExamPageProps) {
  const { examId } = await params;
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

  if (!exam) {
    notFound();
  }

  const topicItems = exam.topics.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    href: `/exams/${examId}/${t.id}`,
    meta: `${t._count.subtopics} Sub Topics`
  }));

  const breadcrumbItems = [
    { label: "Exams", href: "/exams" },
    { label: exam.title }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Breadcrumbs items={breadcrumbItems} />

        <ContentHeader
          icon={<BookOpen24Regular style={{ color: "white" }} />}
          gradient="linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)"
          title={exam.title}
          description={exam.description}
        />

        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
          Main Topics
        </h2>
        <DirectoryCardList items={topicItems} itemLabel="main topics" searchPlaceholder="Search main topics..." />
      </main>
    </div>
  );
}
