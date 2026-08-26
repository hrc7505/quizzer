"use client";

import * as React from "react";
import { Languages, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { BatchProgressCard } from "@/components/feedback/BatchProgressCard";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { cn } from "@/utils/cn";
import type { TranslateQuizDialogBodyProps } from "@/components/data-display/interfaces/TranslateQuizDialogBody.interface";

const TARGET_LANGUAGES = [
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳", desc: "Anek Gujarati font typography" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", desc: "Hind font typography" },
  { code: "en", label: "English", native: "English", flag: "🇺🇸", desc: "Winky Sans font typography" },
];

const BATCH_SIZE = 6;

interface LangStatus {
  count: number;
  percent: number;
}

interface ServerBatchQueue {
  targetLanguage: string;
  status: "IDLE" | "PROCESSING" | "PAUSED" | "FAILED" | "COMPLETED";
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  processedQuestions: number;
  totalQuestions: number;
  error: string | null;
  failedBatchIndex?: number | null;
}

interface QuizTranslateStatus {
  totalQuestions: number;
  languages: {
    en: LangStatus;
    gu: LangStatus;
    hi: LangStatus;
  };
  batchQueue?: ServerBatchQueue | null;
}

/**
 * TranslateQuizDialogBody — database-persisted background batch translation dialog.
 * Synced across all devices, browser reloads, and tabs.
 */
export function TranslateQuizDialogBody({
  quizId,
  quizTitle,
  currentLanguage = "en",
  questionCount,
  onSuccess,
  onClose,
}: TranslateQuizDialogBodyProps) {
  const [targetLang, setTargetLang] = React.useState<string>(
    currentLanguage === "gu" ? "hi" : "gu"
  );
  const [actionBusy, setActionBusy] = React.useState(false);
  const [statusData, setStatusData] = React.useState<QuizTranslateStatus | null>(null);
  const hasTriggeredSuccessRef = React.useRef(false);
  const onSuccessRef = React.useRef(onSuccess);

  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Fetch translation & server batch queue status from PostgreSQL
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/translate`);
      if (!res.ok) return;
      const data: QuizTranslateStatus = await res.json();
      setStatusData(data);

      if (data.batchQueue?.status === "COMPLETED" && !hasTriggeredSuccessRef.current) {
        hasTriggeredSuccessRef.current = true;
        soundEffects.playCorrectSound();
        await onSuccessRef.current?.({
          quizId,
          title: quizTitle,
          language: data.batchQueue.targetLanguage,
          mode: "in_place",
        });
      }
    } catch (err) {
      console.warn("Failed to fetch quiz translation status:", err);
    }
  }, [quizId, quizTitle]);

  // Initial fetch on mount
  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Only poll if background batch queue is active (PROCESSING)
  const isBatchActive = statusData?.batchQueue?.status === "PROCESSING";

  React.useEffect(() => {
    if (!isBatchActive) return;
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [isBatchActive, fetchStatus]);

  // ACTION: Start server-side background translation
  const handleStartTranslate = async (options?: { resume?: boolean }) => {
    setActionBusy(true);
    hasTriggeredSuccessRef.current = false;
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          targetLanguage: targetLang,
          resume: options?.resume === true,
          batchSize: BATCH_SIZE,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      console.error("Start translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Resume paused/failed queue
  const handleResume = async () => {
    setActionBusy(true);
    try {
      await fetch(`/api/admin/quizzes/${quizId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resume",
          targetLanguage: statusData?.batchQueue?.targetLanguage || targetLang,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error("Resume translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Restart queue from beginning
  const handleRestart = async () => {
    setActionBusy(true);
    hasTriggeredSuccessRef.current = false;
    try {
      await fetch(`/api/admin/quizzes/${quizId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          targetLanguage: statusData?.batchQueue?.targetLanguage || targetLang,
          resume: false,
          batchSize: BATCH_SIZE,
        }),
      });
      await fetchStatus();
    } catch (err) {
      console.error("Restart translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  const batchQueue = statusData?.batchQueue;
  const hasActiveJob = !!batchQueue && batchQueue.status !== "IDLE";
  const isRunning = batchQueue?.status === "PROCESSING";
  const isCompleted = batchQueue?.status === "COMPLETED";
  const isFailed = batchQueue?.status === "FAILED";
  const isPaused = batchQueue?.status === "PAUSED";

  const totalQuestions = statusData?.totalQuestions || questionCount;
  const targetStatus = statusData?.languages[targetLang as "en" | "gu" | "hi"];
  const hasExistingPartial = targetStatus && targetStatus.count > 0 && targetStatus.percent < 100;

  const activeLangName =
    (batchQueue?.targetLanguage || targetLang) === "gu"
      ? "Gujarati"
      : (batchQueue?.targetLanguage || targetLang) === "hi"
      ? "Hindi"
      : "English";

  return (
    <div className="flex flex-col gap-5 p-1 sm:p-2 min-w-0 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Languages className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">
            Localize Quiz with AI
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {quizTitle} ({totalQuestions} questions)
          </p>
        </div>
      </div>

      {/* Real-time Server Database Batch Card */}
      {hasActiveJob && (
        <BatchProgressCard
          progress={{
            currentBatch: batchQueue.currentBatch,
            totalBatches: batchQueue.totalBatches,
            processedItems: batchQueue.processedQuestions,
            totalItems: batchQueue.totalQuestions,
            itemUnit: "questions",
          }}
          isLoading={isRunning || actionBusy}
          isCompleted={isCompleted}
          error={batchQueue.error || (isPaused ? "Translation queue is paused." : null)}
          failedBatchIndex={batchQueue.failedBatchIndex}
          onResume={handleResume}
          onRestart={handleRestart}
          title={`Translating into ${activeLangName}`}
          description={
            isCompleted
              ? "All questions translated and saved in database!"
              : isRunning
              ? `Translating batch ${batchQueue.currentBatch} of ${batchQueue.totalBatches} on server…`
              : isPaused
              ? "Queue paused on server"
              : isFailed
              ? "Translation failed on server"
              : "Pending in queue"
          }
        />
      )}

      {/* Language Selection View when no active job is running */}
      {!hasActiveJob && (
        <>
          {/* Target Language Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Target Language
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TARGET_LANGUAGES.map((lang) => {
                const isSelected = targetLang === lang.code;
                const isCurrent = currentLanguage === lang.code;
                const langStatus = statusData?.languages[lang.code as "en" | "gu" | "hi"];
                const hasProgress = langStatus && langStatus.count > 0;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setTargetLang(lang.code)}
                    disabled={actionBusy}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer select-none relative",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                        : "border-border/80 bg-card hover:bg-surface-hover",
                      isCurrent && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{lang.flag}</span>
                      {hasProgress && (
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                            langStatus.percent >= 100
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          )}
                        >
                          {langStatus.count} Qs ({langStatus.percent}%)
                        </span>
                      )}
                      {isCurrent && !hasProgress && (
                        <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {lang.native}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {lang.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partial progress alert if continuing next day */}
          {hasExistingPartial && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>Partial Translation Found for {activeLangName}</span>
              </div>
              <p className="text-foreground/80 text-[11px] leading-relaxed">
                <strong>{targetStatus.count}</strong> of <strong>{totalQuestions}</strong> questions ({targetStatus.percent}%) are already translated and saved in the database.
              </p>
            </div>
          )}

          {/* Safety info notice */}
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              AI strictly preserves all LaTeX math formulas ($...$), programming code blocks, and question structures verbatim while running background batches on the server.
            </span>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 flex-wrap">
        <Button type="button" variant="outline" onClick={onClose} disabled={actionBusy}>
          {hasActiveJob && !isCompleted ? "Close & Run in Background" : "Close"}
        </Button>

        {!hasActiveJob && (
          <>
            {hasExistingPartial && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStartTranslate({ resume: true })}
                disabled={actionBusy}
                className="gap-1.5 font-bold text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>Resume ({totalQuestions - (targetStatus?.count || 0)} Remaining)</span>
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => handleStartTranslate({ resume: false })}
              disabled={actionBusy || currentLanguage === targetLang}
              className="gap-1.5 font-bold shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {hasExistingPartial ? "Re-translate from Beginning" : `Start Translating to ${activeLangName}`}
              </span>
            </Button>
          </>
        )}

        {isFailed && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleRestart}
              disabled={actionBusy}
              className="text-xs"
            >
              Restart from Beginning
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleResume}
              disabled={actionBusy}
              className="gap-1.5 shadow-xs font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Resume Translation</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default TranslateQuizDialogBody;
