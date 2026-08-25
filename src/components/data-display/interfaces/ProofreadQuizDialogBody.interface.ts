/**
 * Interface definition for ProofreadQuizDialogBody component.
 */

export interface ProofreadQuizDialogBodyProps {
  /** Target quiz ID to proofread. */
  quizId: string;
  /** Title of the quiz. */
  quizTitle: string;
  /** Language track code to proofread (e.g. "en", "gu", "hi"). */
  language: string;
  /** Number of questions in this language track. */
  questionCount: number;
  /** Callback fired upon completion. */
  onSuccess: () => Promise<void> | void;
  /** Callback to close dialog modal. */
  onClose: () => void;
}
