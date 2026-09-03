import type { ServerBatchQueue, BatchQueueStatus } from "@/types/batch";

export type { ServerBatchQueue, BatchQueueStatus };

/**
 * Interfaces for TranslateQuizDialogBody component.
 */

export interface LangStatus {
  count: number;
  percent: number;
}

export interface QuizTranslateStatus {
  quizId: string;
  totalQuestions: number;
  languages: {
    en: LangStatus;
    gu: LangStatus;
    hi: LangStatus;
    [key: string]: LangStatus;
  };
  batchQueue?: ServerBatchQueue | null;
  batchQueues?: Record<string, ServerBatchQueue>;
}

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
