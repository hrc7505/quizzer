/**
 * Shared type definitions, enums, and utility builders for server background batch operations.
 */

/**
 * Status of a background batch execution queue.
 */
export enum BatchQueueStatus {
  IDLE = "IDLE",
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAUSED = "PAUSED",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

/**
 * Valid action operations for background batch management.
 */
export enum BatchAction {
  START = "start",
  PAUSE = "pause",
  RESUME = "resume",
  CANCEL = "cancel",
  RESTART = "restart",
}

/** Default batch size for translation micro-batches. */
export const DEFAULT_TRANSLATE_BATCH_SIZE = 6;

/**
 * Generic server-persisted batch queue model representing real-time execution state
 * across all background batch operations (e.g., AI translation, proofreading, quiz generation).
 */
export interface ServerBatchQueue {
  /** Target language code if applicable (e.g. 'gu', 'hi', 'en'). */
  targetLanguage?: string;
  /** Alternative alias for target language. */
  language?: string;
  /** Current queue processing state. */
  status: "IDLE" | "PENDING" | "PROCESSING" | "PAUSED" | "FAILED" | "COMPLETED" | BatchQueueStatus;
  /** Total number of batches in this queue. */
  totalBatches: number;
  /** Number of batches successfully completed. */
  completedBatches: number;
  /** Currently active batch index (1-based). */
  currentBatch: number;
  /** Number of individual items/questions processed so far. */
  processedQuestions: number;
  /** Total number of items/questions in the queue. */
  totalQuestions: number;
  /** Error message if any batch failed. */
  error: string | null;
  /** 0-based index of the failed batch for resumption. */
  failedBatchIndex?: number | null;
}

/**
 * Builds the database title prefix for translation batch rows.
 *
 * @param language Target language code
 * @returns Prefix string e.g. `[TRANSLATE:gu]`
 */
export function buildTranslateBatchPrefix(language?: string): string {
  return language ? `[TRANSLATE:${language}]` : "[TRANSLATE:";
}

/**
 * Builds a full database title for translation batch rows.
 *
 * @param language Target language code
 * @param quizTitle Title of the quiz
 * @returns Formatted batch title
 */
export function buildTranslateBatchTitle(language: string, quizTitle: string): string {
  return `${buildTranslateBatchPrefix(language)} ${quizTitle}`;
}
