/**
 * Interfaces for the useBatchLiveSync hook.
 */

export interface UseBatchLiveSyncOptions {
  /** Callback to refresh the underlying list (e.g. fetchQuizzes, fetchQuizDetail). */
  onRefresh: () => Promise<void> | void;
  /** Optional topic ID filter for batch monitoring. */
  topicId?: string;
  /** Polling interval in milliseconds (defaults to 3000ms). */
  pollIntervalMs?: number;
  /** Optional callback fired when all active batches complete. */
  onComplete?: () => void;
}

export interface UseBatchLiveSyncResult {
  /** Current count of pending or processing batches. */
  activeBatchCount: number;
  /** Whether the hook is currently polling for batch updates. */
  isMonitoring: boolean;
  /** Manually trigger or expedite a live sync cycle. */
  triggerSync: () => void;
}
