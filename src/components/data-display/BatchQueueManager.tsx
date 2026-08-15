"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  RefreshCw,
  Trash2,
  Play,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderTree,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/providers/ToastProvider";
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
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BatchQueueManagerProps {
  initialTopicId?: string;
  compact?: boolean;
}

/**
 * BatchQueueManager component displays persistent quiz generation batches,
 * and allows admins to retry failed/pending batches or discard them.
 */
export function BatchQueueManager({ initialTopicId, compact = false }: BatchQueueManagerProps) {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "FAILED" | "PENDING">("ALL");
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [retryingAll, setRetryingAll] = useState(false);
  const [expandedErrorIds, setExpandedErrorIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  const fetchBatches = useCallback(async () => {
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
      console.error(err);
      toast.addToast({ type: "error", message: "Failed to load batch queue" });
    } finally {
      setLoading(false);
    }
  }, [initialTopicId, toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Auto-poll while batches are in PENDING or PROCESSING states
  useEffect(() => {
    const hasActiveBatches = batches.some((b) => b.status === "PENDING" || b.status === "PROCESSING");
    if (!hasActiveBatches) return;

    const interval = setInterval(() => {
      fetchBatches();
    }, 3000);

    return () => clearInterval(interval);
  }, [batches, fetchBatches]);

  const handleRetrySingle = async (id: string) => {
    setRetryingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/batches/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Retry failed");
      }
      toast.addToast({ type: "success", message: data.message || "Batch processed successfully!" });
      fetchBatches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      toast.addToast({ type: "error", message: msg });
      fetchBatches();
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRetryAllFailed = async () => {
    const failedBatches = batches.filter((b) => b.status === "FAILED" || b.status === "PENDING");
    if (failedBatches.length === 0) return;

    setRetryingAll(true);
    let successCount = 0;

    for (const b of failedBatches) {
      setRetryingIds((prev) => new Set(prev).add(b.id));
      try {
        const res = await fetch(`/api/admin/batches/${b.id}/retry`, { method: "POST" });
        if (res.ok) successCount++;
      } catch {
        // Continue with next batch
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(b.id);
          return next;
        });
      }
    }

    setRetryingAll(false);
    toast.addToast({ type: "info", message: `Retried ${failedBatches.length} batches. ${successCount} succeeded.` });
    fetchBatches();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to discard this batch?")) return;
    try {
      const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");
      toast.addToast({ type: "success", message: "Batch discarded" });
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.addToast({ type: "error", message: "Failed to discard batch" });
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
    return b.status === activeTab;
  });

  const failedCount = batches.filter((b) => b.status === "FAILED").length;
  const pendingCount = batches.filter((b) => b.status === "PENDING" || b.status === "PROCESSING").length;

  if (compact && batches.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4 w-full", compact && "rounded-xl border border-warning/30 bg-warning/5 p-4")}>
      {/* Header bar */}
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
                : "Manage and retry multi-quiz batches and uncompleted question imports."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {failedCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetryAllFailed}
              disabled={retryingAll || loading}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              {retryingAll ? <Spinner size="sm" /> : <Play className="h-3.5 w-3.5" />}
              <span>Retry All ({failedCount})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchBatches}
            disabled={loading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {!compact && (
        <div className="flex gap-1.5 border-b border-border/50 pb-2">
          {(["ALL", "FAILED", "PENDING"] as const).map((tab) => (
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
              {tab === "FAILED" && `Failed (${failedCount})`}
              {tab === "PENDING" && `Pending (${pendingCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Batch Cards */}
      {loading && batches.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
          <Spinner size="sm" /> Loading batch queue…
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border text-center">
          <CheckCircle2 className="h-8 w-8 text-success/70 mb-2" />
          <p className="text-sm font-semibold text-foreground">No batches in queue</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            All quizzes have been generated and processed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBatches.map((batch) => {
            const isRetrying = retryingIds.has(batch.id);
            const isErrorExpanded = expandedErrorIds.has(batch.id);

            return (
              <div
                key={batch.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-4 transition-all shadow-xs gap-3",
                  batch.status === "FAILED" && "border-danger/30 bg-danger/[0.02]",
                  batch.status === "PROCESSING" && "border-primary/40 bg-primary/[0.02]",
                  batch.status === "PENDING" && "border-border"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                      <span>Created: {new Date(batch.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRetrySingle(batch.id)}
                      disabled={isRetrying || batch.status === "PROCESSING"}
                      className="h-8 px-3 text-xs font-semibold gap-1.5"
                    >
                      {isRetrying ? (
                        <Spinner size="sm" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      <span>Retry</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(batch.id)}
                      disabled={isRetrying}
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
    </div>
  );
}
