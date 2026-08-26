"use client";

import { memo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { QuestionImage } from "@/components/data-display/QuestionImage";
import { AnswerCallout } from "@/components/data-display/AnswerCallout";
import { QuestionText } from "@/components/data-display/QuestionText";
import { useTranslation } from "@/contexts/LanguageContext";

import type { DetailedQuestionAccordionProps } from "@/components/data-display/interfaces/DetailedQuestionAccordion.interface";

/**
 * DetailedQuestionAccordion — compact collapsible question review row for quiz results.
 * Displays correct/wrong statuses, formatted equations, option chips, and deep-dive actions.
 */
function DetailedQuestionAccordionInner({
  question,
  index,
  answer,
  elaborations,
  activeElaborationId,
  handleElaborate,
  onOpenFullPage,
}: DetailedQuestionAccordionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = answer?.isCorrect;

  const isGujarati = /[\u0A80-\u0AFF]/.test(question.text);
  const isHindi = /[\u0900-\u097F]/.test(question.text);
  const lang = isGujarati ? "gu" : isHindi ? "hi" : "en";

  return (
    <div
      data-lang={lang}
      className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-2xs transition-colors min-w-0 max-w-full"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-surface-hover transition-colors duration-150 cursor-pointer min-w-0"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Badge
            variant={isCorrect ? "success" : "danger"}
            className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 px-0 select-none"
          >
            {index + 1}
          </Badge>
          <div className={cn("flex-1 min-w-0", !isCorrect && "text-danger/90")}>
            <QuestionText text={question.text} isCompact size="sm" />
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground/60 select-none">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 bg-secondary/10 border-t border-border/50 flex flex-col gap-4 text-xs min-w-0 max-w-full">
          <div className="pb-2 border-b border-border/40 min-w-0">
            <QuestionText text={question.text} size="base" />
          </div>

          {/* Diagram / Schematic Image */}
          <QuestionImage
            src={question.imageUrl}
            invertInDark={question.invertInDark !== false}
            variant="display"
          />

          {/* Correct Answer Banner */}
          <AnswerCallout
            variant="correct"
            text={question.correctAnswer}
          />

          {/* Incorrect User Choice Banner */}
          {!isCorrect && answer && (
            <AnswerCallout
              variant="incorrect"
              text={answer.selectedAnswer}
            />
          )}

          {/* Explanation Callout */}
          {question.description && (
            <AnswerCallout
              variant="explanation"
              text={question.description}
            />
          )}

          {/* Deep Dive Action Footer */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                {elaborations[question.id]?.data ? t("viewDeepDive", "View Deep Dive") : t("generateDeepDive", "Generate Deep Dive")}
              </span>
            </Button>

            {elaborations[question.id]?.data && (
              <Link href={onOpenFullPage}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-9 font-semibold text-xs text-muted-foreground/80 hover:text-foreground"
                >
                  <span>{t("openFullPage", "Open Full Page")}</span>
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