/**
 * Interfaces for TranslateQuizDialogBody component.
 */

export interface TranslateQuizDialogBodyProps {
  quizId: string;
  quizTitle: string;
  currentLanguage?: string;
  questionCount: number;
  onSuccess: (result: {
    quizId: string;
    title?: string;
    language: string;
    mode: "clone" | "in_place";
  }) => void;
  onClose: () => void;
}
