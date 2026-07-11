import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { notFound } from "next/navigation";
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
          _count: { select: { quizzes: true } }
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
    meta: `${t._count.quizzes} Quizzes`
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "10px",
            background: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <BookOpen24Regular style={{ color: "white" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#242424", margin: 0 }}>{exam.title}</h1>
            {exam.description && (
              <p style={{ color: "#616161", fontSize: "14px", margin: "4px 0 0 0" }}>
                {exam.description}
              </p>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
          Main Topics
        </h2>
        <DirectoryCardList items={topicItems} itemLabel="main topics" searchPlaceholder="Search main topics..." />
      </main>
    </div>
  );
}
