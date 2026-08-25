/**
 * Interfaces for DetailedQuestionAccordion component.
 */

import type { QuestionData, UserAnswerData } from "@/components/data-display/interfaces/QuizResults.interface";

export interface DetailedQuestionAccordionProps {
  question: QuestionData;
  index: number;
  answer?: UserAnswerData;
  elaborations: Record<string, { loading: boolean; data?: string; error?: string }>;
  activeElaborationId: string | null;
  handleElaborate: (id: string) => void;
  onOpenFullPage: string;
}
