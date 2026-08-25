/**
 * Interfaces for QuizQuestionCard component.
 */

export interface QuizQuestionCardData {
  id: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
  hint?: string | null;
  description?: string | null;
  options: string[];
  correctAnswer: string;
}

export interface QuizQuestionCardProps {
  question: QuizQuestionCardData;
  selectedOption: string | null;
  showHint: boolean;
  onOptionClick: (option: string, origin?: { x: number; y: number }) => void;
  onToggleHint: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastQuestion: boolean;
}
