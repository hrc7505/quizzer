"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { soundEffects } from "@/lib/services/sound-effects.service";
import type {
  UseBatchLiveSyncOptions,
  UseBatchLiveSyncResult,
} from "./interfaces/useBatchLiveSync.interface";

/**
 * useBatchLiveSync hook.
 * Monitors background AI quiz generation batches and automatically live-updates
 * the underlying quizzes and questions list as batches make progress or finish.
 *
 * @param options Configuration options including the refresh callback and filters.
 * @returns State and controls for active batch monitoring.
 */
export function useBatchLiveSync({
  onRefresh,
  topicId,
  pollIntervalMs = 3000,
  onComplete,
}: UseBatchLiveSyncOptions): UseBatchLiveSyncResult {
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const wasActiveRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const checkBatches = useCallback(async () => {
    try {
      const url = topicId
        ? `/api/admin/batches?topicId=${encodeURIComponent(topicId)}`
        : "/api/admin/batches";
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data)) {
        const active = data.filter(
          (b: { status: string }) => b.status === "PENDING" || b.status === "PROCESSING"
        );
        const count = active.length;
        setActiveBatchCount(count);

        if (count > 0) {
          wasActiveRef.current = true;
          setIsMonitoring(true);
          // Progressively refresh underlying table
          await onRefreshRef.current();
        } else if (wasActiveRef.current) {
          // Batches were previously active and just finished
          wasActiveRef.current = false;
          setIsMonitoring(false);
          await onRefreshRef.current();
          soundEffects.playCorrectSound();
          onCompleteRef.current?.();
        } else {
          setIsMonitoring(false);
        }
      }
    } catch (e) {
      console.error("useBatchLiveSync poll error:", e);
    }
  }, [topicId]);

  const triggerSync = useCallback(() => {
    wasActiveRef.current = true;
    setIsMonitoring(true);
    checkBatches();
  }, [checkBatches]);

  useEffect(() => {
    // Initial check on mount to see if any background batches are already running
    checkBatches();
  }, [checkBatches]);

  useEffect(() => {
    if (!isMonitoring) return;

    const timer = setInterval(() => {
      checkBatches();
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [isMonitoring, pollIntervalMs, checkBatches]);

  return {
    activeBatchCount,
    isMonitoring,
    triggerSync,
  };
}

export default useBatchLiveSync;
