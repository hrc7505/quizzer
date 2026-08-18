"use client";

import * as React from "react";
import { GitMerge, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/OverlayProvider";
import { cn } from "@/utils/cn";
import { difficultyColor } from "@/lib/format";
import type { MergeQuizzesDialogBodyProps, MergeQuizzesFormState } from "./interfaces/MergeQuizzesDialogBody.interface";

/**
 * MergeQuizzesDialogBody — interactive modal dialog allowing admins to select
 * the primary quiz to keep, rename the consolidated quiz, and execute the merge.
 */
export function MergeQuizzesDialogBody({
  selectedQuizzes,
  initialForm,
  onConfirm,
  loading = false,
}: MergeQuizzesDialogBodyProps) {
  const dialog = useDialog();
  const [form, setForm] = React.useState<MergeQuizzesFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const totalQuestions = React.useMemo(() => {
    return selectedQuizzes.reduce((sum, q) => sum + (q._count?.questions || 0), 0);
  }, [selectedQuizzes]);

  const targetQuiz = selectedQuizzes.find((q) => q.id === form.targetQuizId) || selectedQuizzes[0];

  const handleSelectTarget = (id: string) => {
    const selected = selectedQuizzes.find((q) => q.id === id);
    setForm({
      targetQuizId: id,
      targetTitle: selected?.title || form.targetTitle || "",
    });
  };

  const handleExecute = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(form);
      dialog.close();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-xs text-foreground/90 px-1.5 py-1">
      {/* Overview Banner */}
      <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary">
        <GitMerge className="h-5 w-5 shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-xs text-foreground truncate">
            Merging {selectedQuizzes.length} Quizzes into 1
          </span>
          <span className="text-[11px] text-muted-foreground">
            Total combined questions after merge: <strong className="text-foreground">{totalQuestions} questions</strong>
          </span>
        </div>
      </div>

      {/* Select Primary Target Quiz */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-foreground text-xs">
          Select Primary Quiz to Keep (Target):
        </label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          All questions and attempt history from the other quizzes will be transferred into this quiz.
        </p>

        <div className="flex flex-col gap-2 mt-1 max-h-60 overflow-y-auto pr-0.5">
          {selectedQuizzes.map((quiz) => {
            const isSelected = quiz.id === form.targetQuizId;
            return (
              <button
                key={quiz.id}
                type="button"
                onClick={() => handleSelectTarget(quiz.id)}
                className={cn(
                  "w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-primary/5 border-primary shadow-xs"
                    : "bg-card border-border/70 hover:border-border hover:bg-secondary/20"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-muted-foreground/40 bg-background"
                    )}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-xs text-foreground truncate block">
                      {quiz.title}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground truncate block">
                      #{quiz.quizOrder} · {quiz._count?.questions || 0} questions · {quiz._count?.attempts || 0} attempts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
                  <Badge variant={difficultyColor(quiz.difficulty)} className="text-[9px] px-1.5 py-0">
                    {quiz.difficulty}
                  </Badge>
                  {isSelected && (
                    <Badge variant="success" className="text-[9px] font-bold">
                      Target
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Quiz Title Input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="merge-target-title" className="font-bold text-foreground text-xs">
          Final Consolidated Quiz Title:
        </label>
        <Input
          id="merge-target-title"
          value={form.targetTitle}
          onChange={(e) => setForm(prev => ({ ...prev, targetTitle: e.target.value }))}
          placeholder="e.g. Comprehensive Network Analysis Quiz"
          className="h-10 text-xs"
        />
      </div>

      {/* Deletion Warning */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          The other <strong>{selectedQuizzes.length - 1} source {selectedQuizzes.length - 1 === 1 ? "quiz" : "quizzes"}</strong> will be permanently removed once their questions are transferred into <strong>&quot;{form.targetTitle || targetQuiz?.title}&quot;</strong>.
        </span>
      </div>

      {/* Dialog Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border/40 mt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => dialog.close()}
          disabled={isSubmitting || loading}
          className="w-full sm:w-auto h-9 px-4 text-xs font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleExecute}
          disabled={!form.targetTitle.trim() || isSubmitting || loading}
          className="w-full sm:w-auto h-9 px-4 text-xs font-semibold gap-1.5 whitespace-nowrap"
        >
          {isSubmitting || loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Merging Quizzes...</span>
            </>
          ) : (
            <>
              <GitMerge className="h-3.5 w-3.5 shrink-0" />
              <span>Confirm &amp; Merge Quizzes</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
