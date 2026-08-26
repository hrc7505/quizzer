"use client";

import * as React from "react";
import { Edit, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { QuestionImage } from "@/components/data-display/QuestionImage";
import { AnswerCallout } from "@/components/data-display/AnswerCallout";
import { OptionText } from "@/components/data-display/OptionText";
import { QuestionText } from "@/components/data-display/QuestionText";
import { QuestionCardData, QuestionCardProps } from "@/components/data-display/interfaces/QuestionCard.interface";

export type { QuestionCardData, QuestionCardProps };

/**
 * Renders the question hint and detailed explanation callouts.
 */
function HintExplanation({ question }: { question: QuestionCardData }) {
  if (!question.hint && !question.description) return null;
  return (
    <div className="flex flex-col gap-2 min-w-0 max-w-full">
      {question.hint && (
        <AnswerCallout variant="hint" text={question.hint} />
      )}
      {question.description && (
        <AnswerCallout variant="explanation" text={question.description} />
      )}
    </div>
  );
}

/**
 * Renders the 2-column or 1-column option choice grid with support for badges and pair matching chips.
 */
function OptionGrid({ question, optionVariant }: { question: QuestionCardData; optionVariant: "badge" | "plain" }) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 select-none min-w-0",
      optionVariant === "badge" && "gap-3.5"
    )}>
      {question.options.map((opt, oIdx) => {
        const isCorrect = opt === question.correctAnswer;
        return (
          <div
            key={oIdx}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold min-w-0",
              optionVariant === "badge" && "gap-3 p-3.5 rounded-xl text-xs",
              isCorrect
                ? "border-success/20 bg-success/5 text-success"
                : "border-border/40 bg-card text-foreground/70",
              optionVariant === "badge" && !isCorrect && "border-border/60 text-foreground/80"
            )}
          >
            {optionVariant === "badge" ? (
              <span className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[9px] border shrink-0",
                isCorrect
                  ? "bg-success text-white border-success/10"
                  : "bg-secondary text-muted-foreground/80 border-border/80"
              )}>
                {oIdx + 1}
              </span>
            ) : (
              <span className="opacity-75 shrink-0">{oIdx + 1}.</span>
            )}
            <div className="flex-1 min-w-0 break-words">
              <OptionText text={opt} /> {isCorrect && "✓"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * QuestionCard — reusable question display card with thumbnail diagrams,
 * responsive option pills, inline formulas, and optional edit/delete actions.
 */
export function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  optionVariant = "plain",
  className,
}: QuestionCardProps) {
  const isGujarati = /[\u0A80-\u0AFF]/.test(question.text);
  const isHindi = /[\u0900-\u097F]/.test(question.text);
  const lang = isGujarati ? "gu" : isHindi ? "hi" : "en";

  return (
    <Card
      data-lang={lang}
      className={cn("p-5 border border-border/80 bg-card shadow-sm flex flex-col gap-4 rounded-xl min-w-0 max-w-full", optionVariant === "badge" && "p-6 gap-5 rounded-2xl", className)}
    >
      <div className="flex items-start justify-between gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <QuestionText
            text={question.text}
            index={index}
            size={optionVariant === "badge" ? "base" : "sm"}
          />
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg border border-border/50 bg-surface"
                onClick={() => onEdit(question)}
                aria-label="Edit question"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                onClick={() => onDelete(question)}
                aria-label="Delete question"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Question Diagram Thumbnail */}
      <QuestionImage
        src={question.imageUrl}
        alt="Question diagram thumbnail"
        invertInDark={question.invertInDark !== false}
        variant="thumbnail"
      />

      <OptionGrid question={question} optionVariant={optionVariant} />

      <HintExplanation question={question} />
    </Card>
  );
}

export default QuestionCard;
