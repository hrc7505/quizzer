"use client";

import * as React from "react";
import { Edit, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { sanitizeImageUrl } from "@/lib/format";
import { MarkdownContent } from "@/components/data-display/MarkdownContent";
import { OptionText } from "@/components/data-display/OptionText";
import { QuestionText } from "@/components/data-display/QuestionText";
import { ShimmerImage } from "@/components/ui/ShimmerImage";

export interface QuestionCardData {
  id: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
}

interface QuestionCardProps {
  question: QuestionCardData;
  index?: number;
  onEdit?: (question: QuestionCardData) => void;
  onDelete?: (question: QuestionCardData) => void;
  /** "badge" shows a circular number indicator (directory / quiz pages). */
  optionVariant?: "badge" | "plain";
  className?: string;
}

function HintExplanation({ question }: { question: QuestionCardData }) {
  if (!question.hint && !question.description) return null;
  return (
    <div className="flex flex-col gap-2 bg-secondary/10 rounded-lg p-3 text-[10px] text-muted-foreground border border-border/30 select-none sm:text-xs">
      {question.hint && (
        <div>
          <strong className="text-foreground/90 font-bold">Hint:</strong>{" "}
          <span className="font-medium text-muted-foreground/95">{question.hint}</span>
        </div>
      )}
      {question.description && (
        <div className={cn(question.hint && "border-t border-border/20 pt-1.5 mt-0.5")}>
          <strong className="text-foreground/90 font-bold block mb-1">Explanation:</strong>
          <MarkdownContent content={question.description} className="text-[11px] sm:text-xs font-normal" />
        </div>
      )}
    </div>
  );
}

function OptionGrid({ question, optionVariant }: { question: QuestionCardData; optionVariant: "badge" | "plain" }) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 select-none",
      optionVariant === "badge" && "gap-3.5"
    )}>
      {question.options.map((opt, oIdx) => {
        const isCorrect = opt === question.correctAnswer;
        return (
          <div
            key={oIdx}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold",
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
            <span className="truncate flex-1"><OptionText text={opt} /> {isCorrect && "✓"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
  optionVariant = "plain",
  className,
}: QuestionCardProps) {
  const safeImageUrl = sanitizeImageUrl(question.imageUrl);

  return (
    <Card className={cn("p-5 border border-border/80 bg-card shadow-sm flex flex-col gap-4 rounded-xl", optionVariant === "badge" && "p-6 gap-5 rounded-2xl", className)}>
      <div className="flex items-start justify-between gap-4">
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

      {safeImageUrl && (
        <div className="flex justify-start">
          <div className="p-2.5 border border-border/70 rounded-xl bg-card/60 dark:bg-zinc-950/80 max-w-xs overflow-hidden flex items-center justify-center">
            <ShimmerImage
              src={safeImageUrl}
              alt="Question diagram thumbnail"
              invertInDark={question.invertInDark !== false}
              containerClassName="min-h-[90px] w-full max-w-xs"
              className="max-h-36 w-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}

      <OptionGrid question={question} optionVariant={optionVariant} />

      <HintExplanation question={question} />
    </Card>
  );
}
