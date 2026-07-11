import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { notFound } from "next/navigation";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";

export const dynamic = "force-dynamic";

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
          include: {
            _count: { select: { quizzes: true } }
          },
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Breadcrumbs items={breadcrumbItems} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <BookOpen24Regular style={{ color: "white" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#242424", margin: 0 }}>{topic.title}</h1>
            {topic.description && (
              <p style={{ color: "#616161", fontSize: "14px", margin: "4px 0 0 0" }}>
                {topic.description}
              </p>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
          Subtopics
        </h2>
        <DirectoryCardList items={subtopicItems} itemLabel="subtopics" searchPlaceholder="Search subtopics..." />
      </main>
    </div>
  );
}
