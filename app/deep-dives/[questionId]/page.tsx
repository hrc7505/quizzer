import { prisma } from "@/lib/prisma";
import { DeepDiveDetail } from "@/components/ui/DeepDiveDetail";
import { PageLayout } from "@/components/ui/PageLayout";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

  if (!question) return notFound();

  return (
    <PageLayout variant="deep-dives-detail" navMaxWidth="900px" mainMaxWidth="900px">
      <DeepDiveDetail question={question} />
    </PageLayout>
  );
}
