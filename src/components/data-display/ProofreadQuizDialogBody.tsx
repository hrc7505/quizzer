"use client";

import * as React from "react";
import { Wand2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { BatchProgressCard } from "@/components/feedback/BatchProgressCard";
import { soundEffects } from "@/lib/services/sound-effects.service";
import type { ProofreadQuizDialogBodyProps } from "./interfaces/ProofreadQuizDialogBody.interface";

const BATCH_SIZE = 8;

interface ServerBatchStatus {
  status: "IDLE" | "PROCESSING" | "PAUSED" | "FAILED" | "COMPLETED";
  quizId: string;
  language: string;
  totalQuestions: number;
  totalBatches: number;
  currentBatch: number;
  completedBatches: number;
  processedQuestions: number;
  error: string | null;
  failedBatchIndex?: number | null;
}

/**
 * ProofreadQuizDialogBody — database-persisted background batch proofreader.
 * Queries PostgreSQL status across all devices, browser reloads, and tabs.
 */
export function ProofreadQuizDialogBody({
  quizId,
  quizTitle,
  language,
  questionCount,
  onSuccess,
  onClose,
}: ProofreadQuizDialogBodyProps) {
  const [loading, setLoading] = React.useState(false);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [serverStatus, setServerStatus] = React.useState<ServerBatchStatus | null>(null);
  const hasTriggeredSuccessRef = React.useRef(false);

  const langLabel =
    language === "gu"
      ? "Gujarati (ગુજરાતી)"
      : language === "hi"
      ? "Hindi (हिन्दी)"
      : "English";

  // Poll server database status
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/questions/fix-language?quizId=${encodeURIComponent(quizId)}&language=${encodeURIComponent(language)}`
      );
      if (!res.ok) return;
      const data: ServerBatchStatus = await res.json();
      setServerStatus(data);

      if (data.status === "COMPLETED" && !hasTriggeredSuccessRef.current) {
        hasTriggeredSuccessRef.current = true;
        soundEffects.playCorrectSound();
        await onSuccess();
      }
    } catch (e) {
      console.warn("Failed to fetch proofread batch status:", e);
    }
  }, [quizId, language, onSuccess]);

  // Initial fetch and auto-polling if active
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    fetchStatus();

    interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStatus]);

  // ACTION: Start server-side background batch job
  const handleStartProofreading = async () => {
    setActionBusy(true);
    hasTriggeredSuccessRef.current = false;
    try {
      const res = await fetch("/api/admin/questions/fix-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          quizId,
          language,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Resume failed / paused server batches
  const handleResume = async () => {
    setActionBusy(true);
    try {
      await fetch("/api/admin/questions/fix-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resume",
          quizId,
          language,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Restart all batches from beginning
  const handleRestart = async () => {
    setActionBusy(true);
    hasTriggeredSuccessRef.current = false;
    try {
      await fetch("/api/admin/questions/fix-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          quizId,
          language,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setActionBusy(false);
    }
  };

  const isRunning = serverStatus?.status === "PROCESSING";
  const isCompleted = serverStatus?.status === "COMPLETED";
  const isFailed = serverStatus?.status === "FAILED";
  const isPaused = serverStatus?.status === "PAUSED";
  const hasActiveJob = serverStatus && serverStatus.status !== "IDLE";

  const totalItems = serverStatus?.totalQuestions || questionCount;
  const processedItems = serverStatus?.processedQuestions || 0;
  const totalBatches = serverStatus?.totalBatches || Math.ceil(totalItems / BATCH_SIZE) || 1;
  const currentBatch = serverStatus?.currentBatch || 1;

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Overview Info Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-2xl">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
          <Wand2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground">
              Proofread {langLabel} Questions
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {totalItems} Questions
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            AI runs background micro-batches of {BATCH_SIZE} questions in PostgreSQL. It repairs spelling, grammar, broken conjuncts (જોડાક્ષરો/संयुक्त वर्ण), OCR artifacts, and explanations while strictly preserving formulas and code.
          </p>
        </div>
      </div>

      {/* Real-time Server Database Progress Card */}
      {hasActiveJob && (
        <BatchProgressCard
          progress={{
            currentBatch,
            totalBatches,
            processedItems,
            totalItems,
            itemUnit: "questions",
          }}
          isLoading={isRunning || actionBusy}
          isCompleted={isCompleted}
          error={serverStatus?.error || (isPaused ? "Batch queue is paused." : null)}
          failedBatchIndex={serverStatus?.failedBatchIndex}
          onResume={handleResume}
          onRestart={handleRestart}
          title={`Server Background Proofreader (${langLabel})`}
          description={
            isCompleted
              ? "All questions verified and saved in database!"
              : isRunning
              ? `Processing batch ${currentBatch} of ${totalBatches} on server…`
              : isPaused
              ? "Queue paused on server"
              : isFailed
              ? "Batch processing failed on server"
              : "Pending in queue"
          }
        />
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
        <Button variant="outline" onClick={onClose} disabled={actionBusy}>
          {hasActiveJob && !isCompleted ? "Close & Run in Background" : "Close"}
        </Button>

        {!hasActiveJob && (
          <Button
            variant="primary"
            onClick={handleStartProofreading}
            disabled={actionBusy || totalItems === 0}
            className="gap-1.5 shadow-xs font-bold"
          >
            <Sparkles className="h-4 w-4" />
            <span>Start Background Proofreading</span>
          </Button>
        )}

        {isFailed && (
          <>
            <Button
              variant="outline"
              onClick={handleRestart}
              disabled={actionBusy}
              className="text-xs"
            >
              Restart from Beginning
            </Button>
            <Button
              variant="primary"
              onClick={handleResume}
              disabled={actionBusy}
              className="gap-1.5 shadow-xs font-bold"
            >
              <Sparkles className="h-4 w-4" />
              <span>Resume Server Queue</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProofreadQuizDialogBody;
