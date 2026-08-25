"use client";

import * as React from "react";
import { Check, X, Sparkles, Lightbulb } from "lucide-react";

import { OptionText } from "@/components/data-display/OptionText";
import { MarkdownContent } from "@/components/data-display/MarkdownContent";
import { cn } from "@/utils/cn";
import type { AnswerCalloutProps } from "@/components/data-display/interfaces/AnswerCallout.interface";

/**
 * AnswerCallout — reusable display banner for correct answers, user choices,
 * answer explanations, and hints across quizzes and results.
 */
export function AnswerCallout({
  variant,
  text,
  children,
  title,
  className,
}: AnswerCalloutProps) {
  // 1. Correct Answer Callout
  if (variant === "correct") {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 bg-success/10 border border-success/20 p-3 rounded-xl min-w-0 max-w-full",
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-success font-bold text-[10px] uppercase tracking-wider select-none">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{title || "Correct Answer"}</span>
        </div>
        <div className="text-foreground font-semibold text-xs sm:text-sm leading-relaxed min-w-0 break-words">
          {text ? <OptionText text={text} /> : children}
        </div>
      </div>
    );
  }

  // 2. Incorrect / User Choice Callout
  if (variant === "incorrect") {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 bg-danger/10 border border-danger/20 p-3 rounded-xl min-w-0 max-w-full",
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-danger font-bold text-[10px] uppercase tracking-wider select-none">
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>{title || "Your Answer"}</span>
        </div>
        <div className="text-foreground font-semibold text-xs sm:text-sm leading-relaxed min-w-0 break-words">
          {text ? <OptionText text={text} /> : children}
        </div>
      </div>
    );
  }

  // 3. Explanation Callout
  if (variant === "explanation") {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 bg-card/80 dark:bg-zinc-900/50 border border-border/60 p-3 sm:p-3.5 rounded-xl min-w-0 max-w-full shadow-2xs",
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-primary font-bold text-xs select-none">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{title || "Explanation"}</span>
        </div>
        <div className="min-w-0 break-words">
          {typeof text === "string" ? (
            <MarkdownContent content={text} className="text-xs sm:text-sm" />
          ) : (
            children
          )}
        </div>
      </div>
    );
  }

  // 4. Hint Callout
  return (
    <div
      className={cn(
        "rounded-xl border border-warning/30 bg-warning/5 dark:bg-warning/10 p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed shadow-2xs min-w-0 max-w-full",
        className
      )}
    >
      <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 break-words">
        <span className="font-bold text-warning select-none">{title || "Hint: "}</span>
        <span>{text || children}</span>
      </div>
    </div>
  );
}

export default AnswerCallout;
