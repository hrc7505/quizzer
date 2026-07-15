import { ExamsPageClient } from "./ExamsPageClient";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Exams Directory · Quizzer",
  description: "Select an exam or standalone topic to begin practicing."
};

export const revalidate = 60;

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
        title: { not: INTERNAL_TOPIC_TITLE }
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

  return <ExamsPageClient examItems={examItems} standaloneItems={standaloneItems} />;
}
