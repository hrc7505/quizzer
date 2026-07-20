import { prisma } from "@/lib/prisma";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";
import { DeepDivesLibrary } from "@/components/data-display/DeepDivesLibrary";
import { PageLayout } from "@/components/layouts/PageLayout";

export const revalidate = 60;

export const metadata = {
  title: "AI Deep Dives Library",
  description: "Browse all AI-generated deep dive explanations for quiz questions, organized by topic and quiz."
};

/**
 * Public Deep Dives Library page.
 * Server-renders all saved elaborations from the DB, grouped by topic.
 */
export default async function DeepDivesPage() {
  const questions = await prisma.question.findMany({
    where: {
      elaboration: { not: null },
      topic: { isNot: { title: INTERNAL_TOPIC_TITLE } }
    },
    select: {
      id: true,
      text: true,
      correctAnswer: true,
      topic: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true, difficulty: true } }
    },
    orderBy: [{ topic: { title: "asc" } }]
  });

  return (
    <PageLayout variant="deep-dives">
      <DeepDivesLibrary questions={questions} />
    </PageLayout>
  );
}
