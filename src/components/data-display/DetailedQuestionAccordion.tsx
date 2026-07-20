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
    <div className="border border-border/60 rounded-xl overflow-hidden mb-3 bg-card transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left gap-3.5 hover:bg-surface-hover transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge
            variant={isCorrect ? "success" : "danger"}
            className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 px-0"
          >
            {index + 1}
          </Badge>
          <span
            className={cn(
              "text-sm font-semibold text-foreground leading-snug truncate pr-4",
              !isCorrect && "text-danger/90 font-bold"
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
        <div className="p-4 sm:p-5 bg-secondary/15 border-t border-border/50 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1 bg-success/10 text-success border border-success/10 p-3 rounded-lg font-medium">
            <span className="font-bold text-[10px] uppercase tracking-wider opacity-95">
              ✓ Correct Answer
            </span>
            <span className="text-foreground font-semibold">{question.correctAnswer}</span>
          </div>

          {!isCorrect && answer && (
            <div className="flex flex-col gap-1 bg-danger/10 text-danger border border-danger/10 p-3 rounded-lg font-medium">
              <span className="font-bold text-[10px] uppercase tracking-wider opacity-95">
                ✗ Your Answer
              </span>
              <span className="text-foreground font-semibold">{answer.selectedAnswer}</span>
            </div>
          )}

          <div className="flex flex-col gap-1 bg-card border border-border/60 p-3.5 rounded-lg">
            <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
              Explanation
            </span>
            <p className="text-foreground/90 leading-relaxed mt-0.5 whitespace-pre-wrap">
              {question.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleElaborate(question.id)}
              disabled={
                elaborations[question.id]?.loading && activeElaborationId === question.id
              }
              className="gap-1.5 h-8 font-semibold text-xs text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40"
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
                  className="gap-1.5 h-8 font-semibold text-xs text-muted-foreground/80 hover:text-foreground"
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