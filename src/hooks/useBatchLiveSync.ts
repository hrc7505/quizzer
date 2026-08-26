"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { soundEffects } from "@/lib/services/sound-effects.service";
import { UseBatchLiveSyncOptions, UseBatchLiveSyncResult } from "@/hooks/interfaces/useBatchLiveSync.interface";

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
  pollIntervalMs = 6000,
  onComplete,
}: UseBatchLiveSyncOptions): UseBatchLiveSyncResult {
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const isMountedRef = useRef(true);
  const wasActiveRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      if (!res.ok || !isMountedRef.current) return;

      const data = await res.json();
      if (!isMountedRef.current) return;

      const batchList: Array<{ status: string }> = Array.isArray(data)
        ? data
        : Array.isArray(data?.batches)
        ? data.batches
        : [];

      const active = batchList.filter(
        (b) => b.status === "PENDING" || b.status === "PROCESSING"
      );
      const count = active.length;

      if (!isMountedRef.current) return;
      setActiveBatchCount(count);

      if (count > 0) {
        wasActiveRef.current = true;
        setIsMonitoring(true);
        // Progressively refresh underlying table
        if (isMountedRef.current) {
          await onRefreshRef.current();
        }
      } else if (wasActiveRef.current) {
        // Batches were previously active and just finished
        wasActiveRef.current = false;
        setIsMonitoring(false);
        if (isMountedRef.current) {
          await onRefreshRef.current();
          soundEffects.playCorrectSound();
          onCompleteRef.current?.();
        }
      } else {
        setIsMonitoring(false);
      }
    } catch (e) {
      console.error("useBatchLiveSync poll error:", e);
    }
  }, [topicId]);

  const triggerSync = useCallback(() => {
    wasActiveRef.current = true;
    if (isMountedRef.current) {
      setIsMonitoring(true);
      checkBatches();
    }
  }, [checkBatches]);

  useEffect(() => {
    // Initial check on mount to see if any background batches are already running
    let active = true;
    const init = async () => {
      if (active && isMountedRef.current) {
        await checkBatches();
      }
    };
    void init();
    return () => {
      active = false;
    };
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
