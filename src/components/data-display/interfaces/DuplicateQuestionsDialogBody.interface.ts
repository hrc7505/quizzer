/**
 * Interfaces for DuplicateQuestionsDialogBody component and duplicate finder logic.
 */

export interface DuplicateQuestionItem {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  elaboration?: string | null;
}

export interface DuplicateGroup {
  /** Unique key representing the duplicate normalized group */
  key: string;
  /** Primary canonical question ID that is recommended to keep */
  primaryQuestionId: string;
  /** All questions belonging to this duplicate cluster */
  questions: DuplicateQuestionItem[];
  /** Number of redundant duplicate entries in this cluster (questions.length - 1) */
  duplicateCount: number;
}

export interface DuplicateScanResult {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  totalDuplicateGroups: number;
  totalDuplicates: number;
  duplicateGroups: DuplicateGroup[];
}

export interface DuplicateQuestionsDialogBodyProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}
