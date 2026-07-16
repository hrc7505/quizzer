"use client";

import { PageLayout } from "@/components/ui/PageLayout";
import { QuizWizard } from "@/components/ui/QuizWizard";

interface QuizClientProps {
  quiz: {
    id: string;
    title: string;
    difficulty: string;
    questions: Array<{
      id: string;
      text: string;
      options: string[];
      correctAnswer: string;
      hint: string;
      description: string;
    }>;
  };
}

/**
 * Shared quiz player wrapper used by both the exam-linked and standalone
 * (topic-linked) quiz routes. Keeping a single component avoids divergence
 * between the two near-identical copies.
 */
export function QuizClient({ quiz }: QuizClientProps) {
  if (!quiz) {
    return null;
  }

  return (
    <PageLayout variant="admin" navMaxWidth="1200px" mainMaxWidth="1200px">
      <QuizWizard quiz={quiz} />
    </PageLayout>
  );
}
