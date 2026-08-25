/**
 * Interface definitions for BatchProgressCard component.
 */

export interface BatchProgressState {
  /** Current batch number (1-indexed). */
  currentBatch: number;
  /** Total number of batches. */
  totalBatches: number;
  /** Number of items processed so far. */
  processedItems: number;
  /** Total items to process. */
  totalItems: number;
  /** Optional custom unit label (e.g. "questions", "quizzes", "records"). Defaults to "questions". */
  itemUnit?: string;
}

export interface BatchProgressCardProps {
  /** Active progress information. */
  progress: BatchProgressState;
  /** Whether the batch operation is actively running. */
  isLoading: boolean;
  /** Whether all batches have successfully finished. */
  isCompleted?: boolean;
  /** Error message if a batch failed. */
  error?: string | null;
  /** Failed batch index for resuming/retrying. */
  failedBatchIndex?: number | null;
  /** Callback to resume execution from the failed batch or current point. */
  onResume?: () => void;
  /** Callback to restart from the beginning. */
  onRestart?: () => void;
  /** Title / label of the batch operation (e.g. "Proofreading Questions", "Localizing Quiz"). */
  title?: string;
  /** Optional extra description or subtitle. */
  description?: string;
  /** Additional CSS class names. */
  className?: string;
}
