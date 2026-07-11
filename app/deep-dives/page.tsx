import { prisma } from "@/lib/prisma";
import { DeepDivesLibrary } from "@/components/ui/DeepDivesLibrary";
import { NavBar } from "@/components/ui/NavBar";

export const dynamic = "force-dynamic";

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
    where: { elaboration: { not: null } },
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <NavBar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <DeepDivesLibrary questions={questions} />
      </main>
    </div>
  );
}
