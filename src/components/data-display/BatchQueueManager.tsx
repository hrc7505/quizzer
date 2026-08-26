"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Square,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { useToast } from "@/components/providers/ToastProvider";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { cn } from "@/utils/cn";

export interface BatchItem {
  id: string;
  topicId: string | null;
  topicTitle: string | null;
  title: string;
  difficulty: string;
  rawText: string;
  batchIndex: number;
  totalBatches: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED";
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatSafeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString();
  } catch {
    return "";
  }
}

interface BatchQueueManagerProps {
  initialTopicId?: string;
  compact?: boolean;
  hideHeader?: boolean;
}

/**
 * BatchQueueManager component displays persistent quiz generation batches,
 * and allows admins to pause, resume, retry, bulk delete, or clear all batches.
 */
export function BatchQueueManager({
  initialTopicId,
  compact = false,
  hideHeader = false,
}: BatchQueueManagerProps) {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PAUSED" | "FAILED">("ALL");
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string>>(new Set());
  const [actionAllLoading, setActionAllLoading] = useState(false);
  const [expandedErrorIds, setExpandedErrorIds] = useState<Set<string>>(new Set());

  // Multi-selection state
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const prevSelectedCountRef = useRef(0);

  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const fetchBatches = useCallback(async (isManualRefresh = false) => {
    try {
      setLoading(true);
      const url = initialTopicId
        ? `/api/admin/batches?topicId=${encodeURIComponent(initialTopicId)}`
        : "/api/admin/batches";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch batches");
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.warn("Could not fetch batches:", err);
      if (isManualRefresh) {
        toastRef.current.addToast({ type: "error", message: "Failed to load batch queue" });
      }
    } finally {
      setLoading(false);
    }
  }, [initialTopicId]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) {
        await fetchBatches();
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [fetchBatches]);

  // Stable auto-poll while batches are in PENDING or PROCESSING states
  const hasActiveBatches = batches.some((b) => b.status === "PENDING" || b.status === "PROCESSING");

  useEffect(() => {
    if (!hasActiveBatches) return;

    const interval = setInterval(() => {
      fetchBatches();
    }, 15000);

    return () => clearInterval(interval);
  }, [hasActiveBatches, fetchBatches]);

  // Sound feedback on multi-selection
  useEffect(() => {
    if (selectedBatchIds.length > prevSelectedCountRef.current) {
      soundEffects.playPopSound();
    }
    prevSelectedCountRef.current = selectedBatchIds.length;
  }, [selectedBatchIds.length]);

  const handleToggleSelectBatch = (id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredList: BatchItem[]) => {
    const allFilteredSelected =
      filteredList.length > 0 && filteredList.every((b) => selectedBatchIds.includes(b.id));

    if (allFilteredSelected) {
      const filteredSet = new Set(filteredList.map((b) => b.id));
      setSelectedBatchIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const next = Array.from(new Set([...selectedBatchIds, ...filteredList.map((b) => b.id)]));
      setSelectedBatchIds(next);
    }
  };

  const handleClearSelection = () => {
    soundEffects.playClearSound();
    setSelectedBatchIds([]);
  };

  // Single Actions: Pause, Resume, Retry, Delete
  const handlePauseSingle = async (id: string) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/batches/${id}/pause`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Pause failed");
      toast.addToast({ type: "success", message: data.message || "Batch paused." });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Pause failed";
      toast.addToast({ type: "error", message: msg });
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleResumeSingle = async (id: string) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/batches/${id}/resume`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Resume failed");
      toast.addToast({ type: "success", message: data.message || "Batch resumed in background." });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Resume failed";
      toast.addToast({ type: "error", message: msg });
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRetrySingle = async (id: string) => {
    setActionLoadingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/batches/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Retry failed");
      soundEffects.playCorrectSound();
      toast.addToast({ type: "success", message: data.message || "Batch processed successfully!" });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      toast.addToast({ type: "error", message: msg });
      fetchBatches();
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Are you sure you want to discard this batch?")) return;
    try {
      const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");
      soundEffects.playPopSound();
      toast.addToast({ type: "success", message: "Batch discarded" });
      setBatches((prev) => prev.filter((b) => b.id !== id));
      setSelectedBatchIds((prev) => prev.filter((bId) => bId !== id));
    } catch {
      toast.addToast({ type: "error", message: "Failed to discard batch" });
    }
  };

  // Bulk Actions: Pause All, Resume All, Retry All, Bulk Delete, Clear All
  const handlePauseAll = async () => {
    setActionAllLoading(true);
    try {
      const res = await fetch("/api/admin/batches/pause-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: initialTopicId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Pause all failed");
      toast.addToast({ type: "success", message: data.message || "All pending batches paused." });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Pause all failed";
      toast.addToast({ type: "error", message: msg });
    } finally {
      setActionAllLoading(false);
    }
  };

  const handleResumeAll = async () => {
    setActionAllLoading(true);
    try {
      const res = await fetch("/api/admin/batches/resume-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: initialTopicId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Resume all failed");
      toast.addToast({ type: "success", message: data.message || "All paused batches resumed." });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Resume all failed";
      toast.addToast({ type: "error", message: msg });
    } finally {
      setActionAllLoading(false);
    }
  };

  const handleRetryAllFailed = async () => {
    const failedBatches = batches.filter((b) => b.status === "FAILED");
    if (failedBatches.length === 0) return;

    setActionAllLoading(true);
    let successCount = 0;

    for (const b of failedBatches) {
      setActionLoadingIds((prev) => new Set(prev).add(b.id));
      try {
        const res = await fetch(`/api/admin/batches/${b.id}/retry`, { method: "POST" });
        if (res.ok) successCount++;
      } catch {
        // Continue
      } finally {
        setActionLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(b.id);
          return next;
        });
      }
    }

    setActionAllLoading(false);
    soundEffects.playCorrectSound();
    toast.addToast({ type: "info", message: `Retried ${failedBatches.length} batches. ${successCount} succeeded.` });
    fetchBatches();
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedBatchIds.length === 0) return;
    if (!confirm(`Are you sure you want to discard ${selectedBatchIds.length} selected batch(es)?`)) return;

    try {
      const res = await fetch("/api/admin/batches/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedBatchIds }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Bulk delete failed");
      soundEffects.playPopSound();
      toast.addToast({ type: "success", message: data.message || "Selected batches discarded." });
      setSelectedBatchIds([]);
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to discard batches";
      toast.addToast({ type: "error", message: msg });
    }
  };

  const handleClearAllBatches = async () => {
    if (!confirm(`Are you sure you want to discard ALL ${batches.length} batches in the queue?`)) return;

    try {
      const res = await fetch("/api/admin/batches/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, topicId: initialTopicId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Clear all failed");
      soundEffects.playPopSound();
      toast.addToast({ type: "success", message: "All batches discarded." });
      setSelectedBatchIds([]);
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to discard all batches";
      toast.addToast({ type: "error", message: msg });
    }
  };

  const toggleErrorExpanded = (id: string) => {
    setExpandedErrorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredBatches = batches.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return b.status === "PENDING" || b.status === "PROCESSING";
    return b.status === activeTab;
  });

  const pendingCount = batches.filter((b) => b.status === "PENDING" || b.status === "PROCESSING").length;
  const pausedCount = batches.filter((b) => b.status === "PAUSED").length;
  const failedCount = batches.filter((b) => b.status === "FAILED").length;

  const isAllFilteredSelected =
    filteredBatches.length > 0 &&
    filteredBatches.every((b) => selectedBatchIds.includes(b.id));

  if (compact && batches.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4 w-full relative", compact && "rounded-xl border border-warning/30 bg-warning/5 p-4")}>
      {/* Header Bar */}
      {!hideHeader ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>{compact ? "Pending Topic Batches" : "Quiz Generation Batch Queue"}</span>
                {batches.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {batches.length}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {compact
                  ? "Batches queued for this subtopic waiting for AI generation or retry."
                  : "Manage, pause, resume, and retry quiz generation batches."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseAll}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-8 text-amber-600 dark:text-amber-400"
                title="Pause all pending batches"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause All ({pendingCount})</span>
              </Button>
            )}

            {pausedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResumeAll}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-8"
                title="Resume all paused batches"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Resume All ({pausedCount})</span>
              </Button>
            )}

            {failedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryAllFailed}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                {actionAllLoading ? <Spinner size="sm" /> : <Play className="h-3.5 w-3.5" />}
                <span>Retry Failed ({failedCount})</span>
              </Button>
            )}

            {batches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllBatches}
                disabled={loading}
                className="gap-1.5 text-xs h-8 text-danger hover:text-danger"
                title="Clear all batches in queue"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBatches(true)}
              disabled={loading}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pb-1 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "PENDING", "PAUSED", "FAILED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === tab
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                )}
              >
                {tab === "ALL" && `All (${batches.length})`}
                {tab === "PENDING" && `Pending (${pendingCount})`}
                {tab === "PAUSED" && `Paused (${pausedCount})`}
                {tab === "FAILED" && `Failed (${failedCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseAll}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-7 px-2 text-amber-600 dark:text-amber-400"
              >
                <Pause className="h-3 w-3" />
                <span>Pause All</span>
              </Button>
            )}

            {pausedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleResumeAll}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-7 px-2"
              >
                <Play className="h-3 w-3" />
                <span>Resume All</span>
              </Button>
            )}

            {failedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRetryAllFailed}
                disabled={actionAllLoading || loading}
                className="gap-1.5 text-xs font-semibold h-7 px-2"
              >
                {actionAllLoading ? <Spinner size="sm" /> : <Play className="h-3 w-3" />}
                <span>Retry Failed</span>
              </Button>
            )}

            {batches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllBatches}
                disabled={loading}
                className="gap-1.5 text-xs h-7 px-2 text-danger"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBatches(true)}
              disabled={loading}
              className="gap-1.5 text-xs h-7 px-2"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs & Select-All bar */}
      {!compact && !hideHeader && (
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "PENDING", "PAUSED", "FAILED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === tab
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                )}
              >
                {tab === "ALL" && `All (${batches.length})`}
                {tab === "PENDING" && `Pending (${pendingCount})`}
                {tab === "PAUSED" && `Paused (${pausedCount})`}
                {tab === "FAILED" && `Failed (${failedCount})`}
              </button>
            ))}
          </div>

          {filteredBatches.length > 0 && (
            <button
              onClick={() => handleSelectAll(filteredBatches)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer px-2 py-1 rounded-md hover:bg-surface"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span>{isAllFilteredSelected ? "Deselect Tab" : "Select All in Tab"}</span>
            </button>
          )}
        </div>
      )}

      {/* Batch List */}
      {loading && batches.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
          <Spinner size="sm" /> Loading batch queue…
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border text-center">
          <CheckCircle2 className="h-8 w-8 text-success/70 mb-2" />
          <p className="text-sm font-semibold text-foreground">No batches in this view</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All quizzes have been generated and processed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBatches.map((batch) => {
            const isLoadingAction = actionLoadingIds.has(batch.id);
            const isErrorExpanded = expandedErrorIds.has(batch.id);
            const isSelected = selectedBatchIds.includes(batch.id);

            return (
              <div
                key={batch.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-4 transition-all shadow-xs gap-3",
                  batch.status === "FAILED" && "border-danger/30 bg-danger/[0.02]",
                  batch.status === "PROCESSING" && "border-primary/40 bg-primary/[0.02]",
                  batch.status === "PAUSED" && "border-amber-500/30 bg-amber-500/[0.02]",
                  batch.status === "PENDING" && "border-border",
                  isSelected && "bg-primary/5 dark:bg-primary/10 border-primary/40"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleSelectBatch(batch.id)}
                      className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {batch.title}
                        </span>
                        {batch.totalBatches > 1 && (
                          <Badge variant="secondary" className="text-[11px] font-semibold">
                            Part {batch.batchIndex} of {batch.totalBatches}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            batch.status === "FAILED"
                              ? "danger"
                              : batch.status === "PROCESSING"
                                ? "info"
                                : batch.status === "PAUSED"
                                  ? "warning"
                                  : "outline"
                          }
                          className="text-[11px]"
                        >
                          {batch.status === "PROCESSING" ? "Generating..." : batch.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {batch.topicTitle && (
                          <span className="flex items-center gap-1 text-primary/80 font-medium">
                            <FolderTree className="h-3 w-3" />
                            {batch.topicId ? (
                              <Link
                                href={`/admin/manage/subtopics/${batch.topicId}/quizzes`}
                                className="hover:underline"
                              >
                                {batch.topicTitle}
                              </Link>
                            ) : (
                              batch.topicTitle
                            )}
                          </span>
                        )}
                        <span>Difficulty: {batch.difficulty}</span>
                        {batch.createdAt && <span>Created: {formatSafeTime(batch.createdAt)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Pause / Resume Controls */}
                    {(batch.status === "PENDING" || batch.status === "PROCESSING") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseSingle(batch.id)}
                        disabled={isLoadingAction}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 text-amber-600 dark:text-amber-400"
                        title="Pause batch generation"
                      >
                        {isLoadingAction ? <Spinner size="sm" /> : <Pause className="h-3.5 w-3.5" />}
                        <span>Pause</span>
                      </Button>
                    )}

                    {batch.status === "PAUSED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResumeSingle(batch.id)}
                        disabled={isLoadingAction}
                        className="h-8 px-2.5 text-xs font-semibold gap-1"
                        title="Resume batch generation"
                      >
                        {isLoadingAction ? <Spinner size="sm" /> : <Play className="h-3.5 w-3.5" />}
                        <span>Resume</span>
                      </Button>
                    )}

                    {batch.status === "FAILED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRetrySingle(batch.id)}
                        disabled={isLoadingAction}
                        className="h-8 px-3 text-xs font-semibold gap-1.5"
                      >
                        {isLoadingAction ? (
                          <Spinner size="sm" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        <span>Retry</span>
                      </Button>
                    )}

                    {/* Discard Single */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSingle(batch.id)}
                      disabled={isLoadingAction}
                      className="h-8 w-8 text-muted-foreground hover:text-danger"
                      title="Discard Batch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {batch.error && (
                  <div className="rounded-lg bg-danger/10 border border-danger/20 p-2.5 text-xs text-danger flex flex-col gap-1">
                    <div
                      className="flex items-center justify-between cursor-pointer font-medium"
                      onClick={() => toggleErrorExpanded(batch.id)}
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Generation Error Detail
                      </span>
                      {isErrorExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                    {isErrorExpanded && (
                      <p className="text-[11px] font-mono leading-relaxed mt-1 whitespace-pre-wrap break-all opacity-90">
                        {batch.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Multi-Select Action Bar for Batches */}
      <FloatingActionBar
        isOpen={selectedBatchIds.length > 0}
        count={selectedBatchIds.length}
        subtitle="Batch queue actions"
        onClear={handleClearSelection}
      >
        <Button
          variant="danger"
          size="sm"
          onClick={handleBulkDeleteSelected}
          className="flex-1 sm:flex-none h-8.5 px-3 text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Discard Selected ({selectedBatchIds.length})</span>
        </Button>
      </FloatingActionBar>
    </div>
  );
}

export default BatchQueueManager;
