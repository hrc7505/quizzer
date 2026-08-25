"use client";

import { memo } from "react";
import { Lightbulb, Loader2, X } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { QuestionImage } from "@/components/data-display/QuestionImage";
import { AnswerCallout } from "@/components/data-display/AnswerCallout";
import { OptionText } from "@/components/data-display/OptionText";
import { QuestionText } from "@/components/data-display/QuestionText";
import { useTranslation } from "@/contexts/LanguageContext";
import type { QuizQuestionCardProps } from "@/components/data-display/interfaces/QuizQuestionCard.interface";

/**
 * QuizQuestionCard — interactive active question interface for quizzes.
 * Provides instant feedback on selection, zoomable diagram lightbox, hints, and explanations.
 */
function QuizQuestionCardInner({
  question,
  selectedOption,
  showHint,
  onOptionClick,
  onToggleHint,
  onNext,
  isSubmitting,
  isLastQuestion,
}: QuizQuestionCardProps) {
  const { t } = useTranslation();

  const isGujarati = /[\u0A80-\u0AFF]/.test(question.text);
  const isHindi = /[\u0900-\u097F]/.test(question.text);
  const lang = isGujarati ? "gu" : isHindi ? "hi" : "en";

  return (
    <Card
      data-lang={lang}
      className="p-6 sm:p-8 flex flex-col gap-6 border border-border/80 bg-card shadow-sm rounded-2xl min-w-0 max-w-full"
    >
      <div className="min-w-0">
        <QuestionText text={question.text} size="base" />
      </div>

      {/* Question Diagram / Schematic Image with Lightbox Zoom */}
      <QuestionImage
        src={question.imageUrl}
        invertInDark={question.invertInDark !== false}
        variant="interactive"
        loading="eager"
      />

      {/* Answer Options */}
      <div className="flex flex-col gap-3 min-w-0" role="group" aria-label="Answer options">
        {question.options.map((opt: string, i: number) => {
          const isSelected = selectedOption === opt;
          const isCorrectAnswer = question.correctAnswer === opt;

          let optionClass =
            "border-border/85 bg-card hover:bg-surface-hover hover:border-border text-foreground";

          if (selectedOption) {
            if (isCorrectAnswer) {
              optionClass = "border-success/30 bg-success/10 text-success font-semibold";
            } else if (isSelected && !isCorrectAnswer) {
              optionClass = "border-danger/30 bg-danger/10 text-danger font-semibold";
            } else {
              optionClass = "border-border/40 opacity-55 text-muted-foreground bg-card";
            }
          }

          return (
            <button
              key={i}
              type="button"
              onClick={(e) => onOptionClick(opt, { x: e.clientX, y: e.clientY })}
              disabled={!!selectedOption}
              className={cn(
                "w-full text-left p-4 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer select-none active:scale-[0.99] duration-100 outline-hidden font-medium min-w-0 break-words",
                optionClass
              )}
              aria-pressed={isSelected}
            >
              <OptionText text={opt} />
            </button>
          );
        })}
      </div>

      {/* Explanation Box post answering */}
      {selectedOption && question.description && (
        <AnswerCallout
          variant="explanation"
          title={t("answerExplanation", "Answer Explanation")}
          text={question.description}
        />
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40 relative">
        <div className="relative">
          {question.hint && !selectedOption && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleHint}
                className={cn(
                  "gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground h-9",
                  showHint && "text-warning bg-warning/10"
                )}
              >
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                <span>{showHint ? t("hideHint", "Hide Hint") : t("needHint", "Need a Hint?")}</span>
              </Button>

              {/* Floating Tooltip Popover */}
              {showHint && (
                <div className="absolute left-0 bottom-12 z-30 w-72 sm:w-80 bg-card border border-border/80 p-3.5 rounded-2xl shadow-xl animate-fade-in backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-warning select-none">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>{t("hintLabel", "Hint")}</span>
                    </span>
                    <button
                      type="button"
                      onClick={onToggleHint}
                      className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-md hover:bg-surface-hover transition-colors"
                      aria-label="Close hint"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {question.hint}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {selectedOption && (
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={onNext}
            disabled={isSubmitting}
            className="gap-2 font-bold px-6 h-10 shadow-md ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isLastQuestion ? t("submitting", "Calculating Results…") : t("completing", "Completing...")}</span>
              </>
            ) : (
              <span>{isLastQuestion ? t("viewResults", "View Results") : t("nextQuestion", "Next Question →")}</span>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}

export const QuizQuestionCard = memo(QuizQuestionCardInner);
export default QuizQuestionCard;
