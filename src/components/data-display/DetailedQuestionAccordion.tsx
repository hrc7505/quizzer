"use client";

import { memo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

import type { QuestionData, UserAnswerData } from "@/components/data-display/interfaces/QuizResults.interface";

interface DetailedQuestionAccordionProps {
  question: QuestionData;
  index: number;
  answer?: UserAnswerData;
  elaborations: Record<string, { loading: boolean; data?: string; error?: string }>;
  activeElaborationId: string | null;
  handleElaborate: (id: string) => void;
  onOpenFullPage: string;
}

function DetailedQuestionAccordionInner({
  question,
  index,
  answer,
  elaborations,
  activeElaborationId,
  handleElaborate,
  onOpenFullPage,
}: DetailedQuestionAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = answer?.isCorrect;

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden bg-card transition-all duration-200",
      isCorrect ? "border-success/30" : "border-danger/30"
    )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-surface-hover transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Badge
            variant={isCorrect ? "success" : "danger"}
            className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 px-0"
          >
            {index + 1}
          </Badge>
          <span
            className={cn(
              "text-sm font-semibold text-foreground leading-relaxed break-words",
              !isCorrect && "text-danger/90"
            )}
          >
            {question.text}
          </span>
        </div>
        <div className="shrink-0 text-muted-foreground/60">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 bg-secondary/10 border-t border-border/50 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-2 bg-success/10 border border-success/20 p-4 rounded-xl">
            <span className="font-bold text-[10px] uppercase tracking-wider text-success">
              ✓ Correct Answer
            </span>
            <span className="text-foreground font-semibold text-sm leading-relaxed">{question.correctAnswer}</span>
          </div>

          {!isCorrect && answer && (
            <div className="flex flex-col gap-2 bg-danger/10 border border-danger/20 p-4 rounded-xl">
              <span className="font-bold text-[10px] uppercase tracking-wider text-danger">
                ✗ Your Answer
              </span>
              <span className="text-foreground font-semibold text-sm leading-relaxed">{answer.selectedAnswer}</span>
            </div>
          )}

          {question.description && (
            <div className="flex flex-col gap-2 bg-card border border-border/60 p-4 rounded-xl">
              <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                Explanation
              </span>
              <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap">
                {question.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleElaborate(question.id)}
              disabled={
                elaborations[question.id]?.loading && activeElaborationId === question.id
              }
              className="gap-1.5 h-9 font-semibold text-xs text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40"
            >
              {elaborations[question.id]?.loading && activeElaborationId === question.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {elaborations[question.id]?.data ? "View Deep Dive" : "Generate Deep Dive"}
              </span>
            </Button>

            {elaborations[question.id]?.data && (
              <Link href={onOpenFullPage}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-9 font-semibold text-xs text-muted-foreground/80 hover:text-foreground"
                >
                  <span>Open Full Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const DetailedQuestionAccordion = memo(DetailedQuestionAccordionInner);
export default DetailedQuestionAccordion;