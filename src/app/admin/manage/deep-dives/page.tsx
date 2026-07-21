import { prisma } from "@/lib/prisma";
import { INTERNAL_TOPIC_TITLE } from "@/lib/constants";
import { AdminDeepDivesManager } from "@/components/data-display/AdminDeepDivesManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Deep Dives · Admin",
  description: "View, regenerate, and delete saved AI elaborations."
};

/**
 * Admin deep dives management page.
 * Provides full CRUD for saved elaborations.
 */
export default async function AdminDeepDivesPage() {
  const questions = await prisma.question.findMany({
    where: {
      elaboration: { not: null },
      topic: { isNot: { title: INTERNAL_TOPIC_TITLE } }
    },
    select: {
      id: true,
      text: true,
      correctAnswer: true,
      elaboration: true,
      topic: { select: { id: true, title: true } },
      quiz: { select: { id: true, title: true, difficulty: true } }
    },
    orderBy: [{ topic: { title: "asc" } }]
  });

  return <AdminDeepDivesManager questions={questions} />;
}
