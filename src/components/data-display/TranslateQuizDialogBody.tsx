"use client";

import * as React from "react";
import { Languages, Sparkles, Copy, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/utils/cn";
import type { TranslateQuizDialogBodyProps } from "@/components/data-display/interfaces/TranslateQuizDialogBody.interface";

const TARGET_LANGUAGES = [
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳", desc: "Anek Gujarati font typography" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳", desc: "Arya font typography" },
  { code: "en", label: "English", native: "English", flag: "🇺🇸", desc: "Winky Sans font typography" },
];

const BATCH_SIZE = 6;

/**
 * Helper to fetch with automatic retry on network or rate limit failure.
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      const data = await res.clone().json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("Request failed after retries");
}

interface LangStatus {
  count: number;
  percent: number;
}

interface QuizTranslateStatus {
  totalQuestions: number;
  languages: {
    en: LangStatus;
    gu: LangStatus;
    hi: LangStatus;
  };
}

/**
 * TranslateQuizDialogBody — dialog for one-click AI translation and localization of quizzes.
 * Supports batch chunking for large quizzes with 300+ questions and live progress tracking.
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
  const [mode, setMode] = React.useState<"clone" | "in_place">("clone");
  const [loading, setLoading] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [statusData, setStatusData] = React.useState<QuizTranslateStatus | null>(null);
  const [progress, setProgress] = React.useState<{
    currentBatch: number;
    totalBatches: number;
    processedQuestions: number;
    totalQuestions: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [failedBatch, setFailedBatch] = React.useState<number | null>(null);
  const [totalBatchesState, setTotalBatchesState] = React.useState<number>(1);
  const [totalQuestionsState, setTotalQuestionsState] = React.useState<number>(questionCount);

  // Fetch current translation status across languages
  React.useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}/translate`);
        const data = await res.json();
        if (!cancelled && !data.error) {
          setStatusData(data);
          if (data.totalQuestions) {
            setTotalQuestionsState(data.totalQuestions);
            setTotalBatchesState(Math.ceil(data.totalQuestions / BATCH_SIZE));
          }
        }
      } catch (err) {
        console.error("Failed to fetch quiz translation status:", err);
      }
    }
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  const handleTranslate = async (options?: { resume?: boolean; startBatchIndex?: number }) => {
    setLoading(true);
    setError(null);
    setIsCompleted(false);

    const isResume = options?.resume ?? false;
    let startBatch = options?.startBatchIndex ?? 0;
    let totalBatches = totalBatchesState;
    let totalQuestions = totalQuestionsState;

    try {
      // Step 1: Initialize translation session (preserves existing if resuming)
      const initRes = await fetchWithRetry(`/api/admin/quizzes/${quizId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          targetLanguage: targetLang,
          mode,
          resume: isResume,
          batchSize: BATCH_SIZE,
        }),
      });

      const initData = await initRes.json();
      if (!initData.success) {
        throw new Error(initData.error || "Failed to initialize translation session");
      }

      totalQuestions = initData.totalQuestions || questionCount;
      totalBatches = initData.totalBatches || 1;
      startBatch = initData.startBatch ?? (isResume ? startBatch : 0);
      const existingCount = initData.existingCount || 0;

      setTotalQuestionsState(totalQuestions);
      setTotalBatchesState(totalBatches);
      setFailedBatch(null);

      setProgress({
        currentBatch: startBatch + 1,
        totalBatches,
        processedQuestions: isResume ? existingCount : Math.min(startBatch * BATCH_SIZE, totalQuestions),
        totalQuestions,
      });

      // Step 2: Process questions in micro-batches (6 per batch) to prevent timeouts
      for (let b = startBatch; b < totalBatches; b++) {
        setProgress({
          currentBatch: b + 1,
          totalBatches,
          processedQuestions: Math.min(b * BATCH_SIZE, totalQuestions),
          totalQuestions,
        });

        try {
          const batchRes = await fetchWithRetry(`/api/admin/quizzes/${quizId}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "batch",
              batchIndex: b,
              batchSize: BATCH_SIZE,
              targetLanguage: targetLang,
              mode,
            }),
          });

          const batchData = await batchRes.json();
          if (!batchData.success) {
            setFailedBatch(b);
            throw new Error(batchData.error || `Translation failed at batch ${b + 1}`);
          }
        } catch (batchErr) {
          setFailedBatch(b);
          throw batchErr;
        }
      }

      // Step 3: Finalize translation and revalidate cache
      setProgress({
        currentBatch: totalBatches,
        totalBatches,
        processedQuestions: totalQuestions,
        totalQuestions,
      });

      const completeRes = await fetchWithRetry(`/api/admin/quizzes/${quizId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          targetLanguage: targetLang,
          mode,
        }),
      });

      const completeData = await completeRes.json();
      if (!completeData.success) {
        throw new Error(completeData.error || "Failed to finalize translation");
      }

      setIsCompleted(true);
      setTimeout(() => {
        onSuccess({
          quizId,
          title: quizTitle,
          language: targetLang,
          mode,
        });
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Translation request failed");
      setLoading(false);
    }
  };

  // ACTIVE PROGRESS SCREEN WHEN TRANSLATING
  if (loading && progress) {
    const pct = isCompleted
      ? 100
      : Math.min(
          99,
          Math.max(
            3,
            Math.round(
              (progress.processedQuestions / (progress.totalQuestions || 1)) * 100
            )
          )
        );

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-6 px-4 text-center min-w-0 max-w-lg animate-fade-in">
        {/* Animated Badge */}
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            {isCompleted ? (
              <CheckCircle2 className="h-10 w-10 text-success animate-scale-in" />
            ) : (
              <Languages className="h-10 w-10 animate-pulse text-primary" />
            )}
          </div>
          {!isCompleted && (
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Title & Info */}
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h3 className="text-base font-bold text-foreground">
            {isCompleted
              ? "Translation Completed!"
              : `Translating into ${
                  targetLang === "gu"
                    ? "Gujarati"
                    : targetLang === "hi"
                    ? "Hindi"
                    : "English"
                }`}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            {isCompleted
              ? `All ${progress.totalQuestions} questions successfully translated.`
              : `Batch ${progress.currentBatch} of ${progress.totalBatches} • ${progress.processedQuestions} of ${progress.totalQuestions} questions`}
          </p>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground px-0.5">
            <span className="text-primary font-semibold">
              {isCompleted ? "Done" : "Processing micro-batches..."}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-secondary/80 rounded-full overflow-hidden p-0.5 border border-border/60">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Status Notice */}
        <div className="p-3 rounded-xl bg-surface/80 border border-border/60 text-left w-full text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            AI is translating in micro-batches of 6 questions to preserve authentic academic terminology, code blocks, and LaTeX math formulas.
          </span>
        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
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
            {quizTitle} ({questionCount} questions)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
          <div className="flex items-center gap-2 text-destructive font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {failedBatch !== null
                ? `Translation Paused at Batch ${failedBatch + 1} of ${totalBatchesState}`
                : "Translation Error"}
            </span>
          </div>
          <p className="text-foreground/80 text-[11px] leading-relaxed">
            {error}
          </p>
          {progress && progress.processedQuestions > 0 && (
            <p className="text-muted-foreground text-[11px] font-semibold">
              ✓ {progress.processedQuestions} of {progress.totalQuestions} questions are already safely saved in the database.
            </p>
          )}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {failedBatch !== null && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleTranslate({ resume: true, startBatchIndex: failedBatch })}
                disabled={loading}
                className="gap-1.5 font-bold h-8 text-xs shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Resume from Batch {failedBatch + 1}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTranslate({ resume: false })}
              disabled={loading}
              className="text-xs h-8"
            >
              Restart from Beginning
            </Button>
          </div>
        </div>
      )}

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
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                      langStatus.percent >= 100
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    )}>
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
      {(() => {
        const targetStatus = statusData?.languages[targetLang as "en" | "gu" | "hi"];
        const total = statusData?.totalQuestions || questionCount;
        if (!targetStatus || targetStatus.count === 0 || targetStatus.percent >= 100) return null;

        const remaining = Math.max(0, total - targetStatus.count);
        const langLabel = targetLang === "gu" ? "Gujarati" : targetLang === "hi" ? "Hindi" : "English";

        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Partial Translation Found for {langLabel}</span>
            </div>
            <p className="text-foreground/80 text-[11px] leading-relaxed">
              <strong>{targetStatus.count}</strong> of <strong>{total}</strong> questions ({targetStatus.percent}%) are already translated and saved in the database.
            </p>
            <p className="text-muted-foreground text-[11px]">
              You can resume directly to translate only the remaining <strong>{remaining}</strong> questions without consuming tokens for already-translated questions.
            </p>
          </div>
        );
      })()}

      {/* Safety info notice */}
      <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <span>
          AI strictly preserves all LaTeX math formulas ($...$), programming code blocks, and question structures verbatim while translating question text and explanations into the selected language track.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        {(() => {
          const targetStatus = statusData?.languages[targetLang as "en" | "gu" | "hi"];
          const total = statusData?.totalQuestions || questionCount;
          const isPartial = targetStatus && targetStatus.count > 0 && targetStatus.count < total;
          const isFullyDone = targetStatus && targetStatus.count >= total;
          const langLabel = targetLang === "gu" ? "Gujarati" : targetLang === "hi" ? "Hindi" : "English";

          if (isPartial) {
            const remaining = total - targetStatus.count;
            return (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslate({ resume: false })}
                  disabled={loading}
                  className="text-xs"
                >
                  Start Over from Scratch
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleTranslate({ resume: true })}
                  disabled={loading}
                  className="gap-2 shadow-sm font-bold text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Resume {langLabel} ({remaining} remaining)
                  </span>
                </Button>
              </>
            );
          }

          return (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleTranslate({ resume: false })}
              disabled={loading}
              className="gap-2 shadow-sm font-bold text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isFullyDone
                  ? `Re-translate to ${langLabel}`
                  : `Translate to ${langLabel}`}
              </span>
            </Button>
          );
        })()}
      </div>
    </div>
  );
}

export default TranslateQuizDialogBody;
