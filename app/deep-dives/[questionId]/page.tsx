import { prisma } from "@/lib/prisma";
import { DeepDiveDetail } from "@/components/ui/DeepDiveDetail";
import { NavBar } from "@/components/ui/NavBar";
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <NavBar maxWidth="900px" />
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <DeepDiveDetail question={question} />
      </main>
    </div>
  );
}
