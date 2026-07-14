import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exams Directory · Quizzer",
  description: "Select an exam or standalone topic to begin practicing."
};

/**
 * Public Exams list view.
 * Lists available Exams and Standalone Main Topics.
 */
export default async function ExamsPage() {
  const [exams, standaloneTopics] = await Promise.all([
    prisma.exam.findMany({
      include: { _count: { select: { topics: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.topic.findMany({
      where: {
        exams: { none: {} },
        parentTopics: { none: {} },
        title: { not: "__internal__" }
      },
      include: {
        _count: { select: { quizzes: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const examItems = exams.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    href: `/exams/${e.id}`,
    meta: `${e._count.topics} Main Topics`
  }));

  const standaloneItems = standaloneTopics.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    href: `/topics/${t.id}`,
    meta: `${t._count.quizzes} Quizzes`
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <ContentHeader
          icon={<BookOpen24Regular style={{ color: "white" }} />}
          gradient="linear-gradient(135deg, #0078d4 0%, #00bcf2 100%)"
          title="Exams Directory"
          description="Select an exam structure or standalone topic category to begin."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
              Exam Curriculums
            </h2>
            <DirectoryCardList items={examItems} itemLabel="exams" searchPlaceholder="Search exams..." />
          </div>

          {standaloneItems.length > 0 && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px", borderBottom: "2px solid #eaeaea", paddingBottom: "8px" }}>
                Standalone Topics
              </h2>
              <DirectoryCardList items={standaloneItems} itemLabel="standalone topics" searchPlaceholder="Search standalone topics..." />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
