import { PageLayout } from "@/components/ui/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { DirectoryCardList } from "@/components/ui/DirectoryCardList";
import { BookOpen24Regular } from "@/components/ui/ServerIcons";
import { prisma } from "@/lib/prisma";

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
    <PageLayout>
      <ContentHeader
        icon={<BookOpen24Regular />}
        variant="exam"
        title="Exams Directory"
        description="Select an exam structure or standalone topic category to begin."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <SectionHeading>Exam Curriculums</SectionHeading>
          <DirectoryCardList items={examItems} itemLabel="exams" searchPlaceholder="Search exams..." />
        </div>

        {standaloneItems.length > 0 && (
          <div>
            <SectionHeading>Standalone Topics</SectionHeading>
            <DirectoryCardList items={standaloneItems} itemLabel="standalone topics" searchPlaceholder="Search standalone topics..." />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
