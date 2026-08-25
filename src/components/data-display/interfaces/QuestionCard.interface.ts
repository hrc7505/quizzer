/**
 * Interfaces for QuestionCard component.
 */

export interface QuestionCardData {
  id: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
}

export interface QuestionCardProps {
  question: QuestionCardData;
  index?: number;
  onEdit?: (question: QuestionCardData) => void;
  onDelete?: (question: QuestionCardData) => void;
  /** "badge" shows a circular number indicator (directory / quiz pages). */
  optionVariant?: "badge" | "plain";
  className?: string;
}
