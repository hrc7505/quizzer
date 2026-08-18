"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Trash2, Sparkles, Loader2, CopyCheck, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { QuestionText } from "@/components/data-display/QuestionText";
import { useToast } from "@/components/providers/ToastProvider";
import { soundEffects } from "@/lib/services/sound-effects.service";
import type {
  DuplicateGroup,
  DuplicateScanResult,
  DuplicateQuestionsDialogBodyProps,
} from "@/components/data-display/interfaces/DuplicateQuestionsDialogBody.interface";

/**
 * DuplicateQuestionsDialogBody — scans a quiz for duplicate questions, previews
 * duplicate clusters, and allows 1-click automatic or selective duplicate removal.
 */
export function DuplicateQuestionsDialogBody({
  quizId,
  quizTitle,
  onClose,
  onSuccess,
}: DuplicateQuestionsDialogBodyProps) {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scanResult, setScanResult] = React.useState<DuplicateScanResult | null>(null);

  const fetchDuplicates = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/duplicates`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setScanResult(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scan quiz for duplicates.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  React.useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  // Clean all duplicates automatically
  const handleAutoCleanAll = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoCleanAll: true }),
      });
      const data = await res.json();
      if (data.error) {
        toast.addToast({ type: "error", message: data.error });
      } else {
        soundEffects.playCorrectSound();
        toast.addToast({
          type: "success",
          message: data.message || `Removed ${data.deletedCount} duplicate questions.`,
        });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.addToast({ type: "error", message: "Failed to remove duplicate questions." });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a specific single duplicate question
  const handleDeleteSingle = async (questionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteQuestionIds: [questionId] }),
      });
      const data = await res.json();
      if (data.error) {
        toast.addToast({ type: "error", message: data.error });
      } else {
        soundEffects.playPopSound();
        toast.addToast({ type: "success", message: "Removed duplicate question entry." });
        await fetchDuplicates();
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.addToast({ type: "error", message: "Failed to remove duplicate question." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 select-none text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-semibold">Scanning quiz for duplicate questions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Alert variant="danger" title="Scan Error">
          {error}
        </Alert>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={fetchDuplicates}>
            Retry Scan
          </Button>
        </div>
      </div>
    );
  }

  const duplicateGroups = scanResult?.duplicateGroups || [];
  const totalDuplicates = scanResult?.totalDuplicates || 0;

  // Case 1: No duplicates found
  if (duplicateGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center border border-success/20 shadow-xs">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-bold text-foreground">No Duplicate Questions Found</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All {scanResult?.totalQuestions || 0} questions in &ldquo;{quizTitle}&rdquo; are unique with no redundant copies.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onClose} className="mt-2 h-9 px-5">
          Done
        </Button>
      </div>
    );
  }

  // Case 2: Duplicates found
  return (
    <div className="flex flex-col gap-5 py-1 max-h-[75vh] overflow-hidden">
      {/* Overview Banner */}
      <div className="flex items-center justify-between gap-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Duplicate Scan Results</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">
              Found <strong className="text-amber-500">{totalDuplicates}</strong> redundant duplicate{totalDuplicates !== 1 ? "s" : ""} across {duplicateGroups.length} cluster{duplicateGroups.length !== 1 ? "s" : ""}.
            </div>
          </div>
        </div>
        <Badge variant="warning" className="shrink-0 font-extrabold text-xs">
          {totalDuplicates} to Remove
        </Badge>
      </div>

      {/* Duplicate Groups List */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-1 max-h-[44vh] custom-scrollbar">
        {duplicateGroups.map((group, groupIdx) => (
          <div
            key={groupIdx}
            className="border border-border/80 rounded-xl p-4 bg-card shadow-2xs flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Group #{groupIdx + 1} ({group.questions.length} Copies)
              </span>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {group.duplicateCount} Redundant
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              {group.questions.map((q, qIdx) => {
                const isPrimary = q.id === group.primaryQuestionId;
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg p-3 border text-xs flex flex-col gap-2 transition-colors ${
                      isPrimary
                        ? "bg-primary/5 border-primary/30"
                        : "bg-secondary/20 border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPrimary ? (
                          <Badge variant="success" className="text-[10px] font-bold uppercase">
                            Keep This (Primary)
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px] font-bold uppercase">
                            Duplicate #{qIdx}
                          </Badge>
                        )}
                        {q.elaboration && (
                          <Badge variant="secondary" className="text-[9px]">
                            Has Deep Dive
                          </Badge>
                        )}
                        {q.imageUrl && (
                          <Badge variant="secondary" className="text-[9px]">
                            Has Image
                          </Badge>
                        )}
                      </div>

                      {!isPrimary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={actionLoading}
                          className="h-7 w-7 text-danger hover:bg-danger/10 rounded-md shrink-0"
                          onClick={() => handleDeleteSingle(q.id)}
                          title="Delete this copy"
                          aria-label="Delete this duplicate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <QuestionText text={q.text} size="sm" />

                    <div className="flex items-center gap-1.5 flex-wrap text-muted-foreground text-[11px] mt-1 pt-1.5 border-t border-border/30">
                      <span className="font-semibold text-foreground/80">Options:</span>
                      {q.options.join(" | ")}
                      <span className="ml-auto font-bold text-success">✓ {q.correctAnswer}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 mt-auto">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={actionLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={actionLoading || totalDuplicates === 0}
          onClick={handleAutoCleanAll}
          className="gap-2 font-bold px-4 h-9 shadow-xs"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span>Remove All {totalDuplicates} Duplicates</span>
        </Button>
      </div>
    </div>
  );
}

export default DuplicateQuestionsDialogBody;
