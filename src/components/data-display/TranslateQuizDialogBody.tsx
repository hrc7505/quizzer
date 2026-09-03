"use client";

import * as React from "react";
import { Languages, Sparkles, RefreshCw, Loader2, Pause, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { BatchProgressCard } from "@/components/feedback/BatchProgressCard";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { QuizTranslationClient } from "@/lib/services/quiz-translation.client";
import { BatchQueueStatus, DEFAULT_TRANSLATE_BATCH_SIZE } from "@/types/batch";
import { TRANSLATION_LANGUAGES_LIST, LanguageCode, getLanguageLabel, SupportedLanguageCode } from "@/types/language";
import { cn } from "@/utils/cn";

import type { TranslateQuizDialogBodyProps, QuizTranslateStatus, ServerBatchQueue } from "@/components/data-display/interfaces/TranslateQuizDialogBody.interface";

/**
 * TranslateQuizDialogBody — database-persisted background batch translation dialog.
 * Supports independent concurrent translations for multiple languages per quiz and across quizzes.
 */
export function TranslateQuizDialogBody({
  quizId,
  quizTitle,
  currentLanguage = LanguageCode.ENGLISH,
  questionCount,
  onSuccess,
  onClose,
}: TranslateQuizDialogBodyProps) {
  const [targetLang, setTargetLang] = React.useState<SupportedLanguageCode>(
    currentLanguage === LanguageCode.GUJARATI ? LanguageCode.HINDI : LanguageCode.GUJARATI
  );
  const [actionBusy, setActionBusy] = React.useState(false);
  const [statusData, setStatusData] = React.useState<QuizTranslateStatus | null>(null);
  const completedLangsRef = React.useRef<Set<string>>(new Set());
  const onSuccessRef = React.useRef(onSuccess);

  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Fetch translation & server batch queue status from PostgreSQL for all languages
  const fetchStatus = React.useCallback(async () => {
    const data = await QuizTranslationClient.getStatus(quizId, targetLang);
    if (!data) return;
    setStatusData(data);

    // Check for any newly completed language queues
    if (data.batchQueues) {
      Object.entries(data.batchQueues).forEach(([lang, queue]) => {
        if (queue.status === BatchQueueStatus.COMPLETED && !completedLangsRef.current.has(lang)) {
          completedLangsRef.current.add(lang);
          soundEffects.playCorrectSound();
          void onSuccessRef.current?.({
            quizId,
            title: quizTitle,
            language: lang,
            mode: "in_place",
          });
        }
      });
    }
  }, [quizId, quizTitle, targetLang]);

  // Initial fetch on mount
  React.useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) {
        await fetchStatus();
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [fetchStatus]);

  // Poll whenever ANY language has an active (PROCESSING) batch queue
  const isAnyBatchActive = React.useMemo(() => {
    if (!statusData?.batchQueues) return false;
    return Object.values(statusData.batchQueues).some(
      (q) => q.status === BatchQueueStatus.PROCESSING
    );
  }, [statusData?.batchQueues]);

  React.useEffect(() => {
    if (!isAnyBatchActive) return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isAnyBatchActive, fetchStatus]);

  // ACTION: Start server-side background translation for selected language
  const handleStartTranslate = async (options?: { resume?: boolean }) => {
    setActionBusy(true);
    completedLangsRef.current.delete(targetLang);
    try {
      const data = await QuizTranslationClient.startTranslation({
        quizId,
        targetLanguage: targetLang,
        resume: options?.resume === true,
        batchSize: DEFAULT_TRANSLATE_BATCH_SIZE,
      });
      if (data.error) throw new Error(data.error);
      await fetchStatus();
    } catch (err) {
      console.error("Start translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Resume paused/failed queue for selected language
  const handleResume = async (langToResume = targetLang) => {
    setActionBusy(true);
    try {
      await QuizTranslationClient.resumeTranslation(quizId, langToResume);
      await fetchStatus();
    } catch (err) {
      console.error("Resume translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // ACTION: Restart queue from beginning for selected language
  const handleRestart = async (langToRestart = targetLang) => {
    setActionBusy(true);
    completedLangsRef.current.delete(langToRestart);
    try {
      await QuizTranslationClient.restartTranslation({
        quizId,
        targetLanguage: langToRestart,
        batchSize: DEFAULT_TRANSLATE_BATCH_SIZE,
      });
      await fetchStatus();
    } catch (err) {
      console.error("Restart translation error:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // Get active queue strictly for the CURRENTLY selected target language
  const currentLangQueue: ServerBatchQueue | null =
    statusData?.batchQueues?.[targetLang] || null;

  const hasActiveJobForCurrentLang =
    !!currentLangQueue && currentLangQueue.status !== BatchQueueStatus.IDLE;
  const isRunning = currentLangQueue?.status === BatchQueueStatus.PROCESSING;
  const isCompleted = currentLangQueue?.status === BatchQueueStatus.COMPLETED;
  const isFailed = currentLangQueue?.status === BatchQueueStatus.FAILED;
  const isPaused = currentLangQueue?.status === BatchQueueStatus.PAUSED;

  const totalQuestions = statusData?.totalQuestions || questionCount;
  const targetStatus = statusData?.languages[targetLang as "en" | "gu" | "hi"];
  const hasExistingPartial =
    targetStatus && targetStatus.count > 0 && targetStatus.percent < 100;

  const activeLangName = getLanguageLabel(targetLang);

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

      {/* Target Language Selection Tabs - Always visible to allow parallel workflows */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Target Language</span>
          {isAnyBatchActive && (
            <span className="text-[10px] font-semibold text-primary flex items-center gap-1 normal-case">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Background jobs active</span>
            </span>
          )}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TRANSLATION_LANGUAGES_LIST.map((lang) => {
            const isSelected = targetLang === lang.code;
            const isCurrent = currentLanguage === lang.code;
            const langStatus = statusData?.languages[lang.code as "en" | "gu" | "hi"];
            const langQueue = statusData?.batchQueues?.[lang.code];
            const isLangProcessing = langQueue?.status === BatchQueueStatus.PROCESSING;
            const isLangPaused = langQueue?.status === BatchQueueStatus.PAUSED;
            const isLangFailed = langQueue?.status === BatchQueueStatus.FAILED;
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
                  isCurrent && "opacity-75"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{lang.flag}</span>
                  {/* Real-time status indicator on tab */}
                  {isLangProcessing ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary flex items-center gap-1 animate-pulse">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      <span>Translating</span>
                    </span>
                  ) : isLangPaused ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Pause className="h-2.5 w-2.5" />
                      <span>Paused</span>
                    </span>
                  ) : isLangFailed ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>Failed</span>
                    </span>
                  ) : hasProgress ? (
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
                  ) : isCurrent ? (
                    <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-bold text-foreground">{lang.nativeLabel}</span>
                <span className="text-[10px] text-muted-foreground">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Server Database Batch Card for CURRENTLY selected language */}
      {hasActiveJobForCurrentLang ? (
        <BatchProgressCard
          progress={{
            currentBatch: currentLangQueue.currentBatch,
            totalBatches: currentLangQueue.totalBatches,
            processedItems: currentLangQueue.processedQuestions,
            totalItems: currentLangQueue.totalQuestions,
            itemUnit: "questions",
          }}
          isLoading={isRunning || actionBusy}
          isCompleted={isCompleted}
          error={currentLangQueue.error || (isPaused ? "Translation queue is paused." : null)}
          failedBatchIndex={currentLangQueue.failedBatchIndex}
          onResume={() => handleResume(targetLang)}
          onRestart={() => handleRestart(targetLang)}
          title={`Translating into ${activeLangName}`}
          description={
            isCompleted
              ? "All questions translated and saved in database!"
              : isRunning
              ? `Translating batch ${currentLangQueue.currentBatch} of ${currentLangQueue.totalBatches} on server…`
              : isPaused
              ? "Queue paused on server"
              : isFailed
              ? "Translation failed on server"
              : "Pending in queue"
          }
        />
      ) : (
        <>
          {/* Partial progress alert if continuing next day */}
          {hasExistingPartial && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>Partial Translation Found for {activeLangName}</span>
              </div>
              <p className="text-foreground/80 text-[11px] leading-relaxed">
                <strong>{targetStatus.count}</strong> of <strong>{totalQuestions}</strong>{" "}
                questions ({targetStatus.percent}%) are already translated and saved in the
                database.
              </p>
            </div>
          )}

          {/* Safety info notice */}
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              AI strictly preserves all LaTeX math formulas ($...$), programming code blocks,
              and question structures verbatim while running background batches on the server.
            </span>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 flex-wrap">
        <Button type="button" variant="outline" onClick={onClose} disabled={actionBusy}>
          {isAnyBatchActive ? "Close & Run in Background" : "Close"}
        </Button>

        {!hasActiveJobForCurrentLang && (
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
                {hasExistingPartial
                  ? `Re-translate to ${activeLangName}`
                  : `Start Translating to ${activeLangName}`}
              </span>
            </Button>
          </>
        )}

        {isFailed && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRestart(targetLang)}
              disabled={actionBusy}
              className="text-xs"
            >
              Restart from Beginning
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleResume(targetLang)}
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
