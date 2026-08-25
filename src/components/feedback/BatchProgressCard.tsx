"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/utils/cn";
import type { BatchProgressCardProps } from "./interfaces/BatchProgressCard.interface";

/**
 * BatchProgressCard — reusable progress and error recovery card for long-running
 * batch operations (AI proofreading, translation, dataset processing).
 */
export function BatchProgressCard({
  progress,
  isLoading,
  isCompleted = false,
  error,
  failedBatchIndex,
  onResume,
  onRestart,
  title,
  description,
  className,
}: BatchProgressCardProps) {
  const percent =
    progress.totalItems > 0
      ? Math.min(100, Math.round((progress.processedItems / progress.totalItems) * 100))
      : 0;

  const itemUnit = progress.itemUnit || "questions";

  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 p-4 rounded-2xl border transition-all duration-300",
        error
          ? "border-danger/40 bg-danger/5"
          : isCompleted
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-primary/20 bg-primary/[0.03]",
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          {isCompleted ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : error ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-danger/10 text-danger shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs sm:text-sm text-foreground truncate">
              {title || (isCompleted ? "Batch Processing Complete" : error ? "Processing Paused" : "Processing Batches…")}
            </span>
            {description && (
              <span className="text-[11px] text-muted-foreground truncate">{description}</span>
            )}
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-foreground border border-border/50">
            Batch {Math.min(progress.currentBatch, progress.totalBatches)} of {progress.totalBatches}
          </span>
          <span className="text-[11px] font-extrabold text-primary px-1.5">{percent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <Progress
          value={percent}
          className="h-2.5 rounded-full bg-secondary/70 overflow-hidden"
          indicatorClassName={cn(
            "transition-all duration-300",
            isCompleted ? "bg-emerald-500" : error ? "bg-danger" : "bg-primary"
          )}
        />
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>
            {progress.processedItems} of {progress.totalItems} {itemUnit} processed
          </span>
          <span>
            {progress.totalItems - progress.processedItems > 0 && !isCompleted
              ? `${progress.totalItems - progress.processedItems} remaining`
              : "All done"}
          </span>
        </div>
      </div>

      {/* Error state with Resume / Restart action buttons */}
      {error && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-danger/20">
          <p className="text-xs text-danger leading-relaxed">{error}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {onResume && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isLoading}
                onClick={onResume}
                className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                <span>Resume from Batch {((failedBatchIndex ?? 0) + 1)}</span>
              </Button>
            )}
            {onRestart && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onRestart}
                className="h-8 px-3 text-xs font-semibold rounded-xl"
              >
                Restart from Beginning
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchProgressCard;
