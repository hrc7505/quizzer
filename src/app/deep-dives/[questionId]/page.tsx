import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";
import { DeepDiveDetail } from "@/components/data-display/DeepDiveDetail";
import { PageLayout } from "@/components/layouts/PageLayout";

export const revalidate = 60;

export async function generateStaticParams() {
  const questions = await prisma.question.findMany({
    where: { elaboration: { not: null } },
    select: { id: true }
  });
  return questions.map(q => ({ questionId: q.id }));
}

/**
 * Individual Deep Dive detail page.
 * Renders the saved elaboration markdown from the DB.
 * No Gemini call — purely DB-driven.
 */
export default async function DeepDiveDetailPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      topic: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true, difficulty: true } }
    }
  });

  if (!question || question.topic.title === INTERNAL_TOPIC_TITLE) return notFound();

  return (
    <PageLayout variant="deep-dives-detail" navMaxWidth="1100px" mainMaxWidth="1100px">
      <DeepDiveDetail question={question} />
    </PageLayout>
  );
}
