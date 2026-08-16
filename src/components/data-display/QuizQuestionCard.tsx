"use client";

import { useState, memo } from "react";
import { Sparkles, Check, Lightbulb, X, Loader2, ZoomIn } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { splitSentences } from "@/lib/text";
import { sanitizeImageUrl } from "@/lib/format";

interface QuizQuestionCardProps {
  question: {
    id: string;
    text: string;
    imageUrl?: string | null;
    invertInDark?: boolean;
    hint?: string | null;
    description?: string | null;
    options: string[];
    correctAnswer: string;
  };
  selectedOption: string | null;
  showHint: boolean;
  onOptionClick: (option: string) => void;
  onToggleHint: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastQuestion: boolean;
}

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
  const [isZoomed, setIsZoomed] = useState(false);
  const shouldInvert = question.invertInDark !== false;
  const safeImageUrl = sanitizeImageUrl(question.imageUrl);

  return (
    <Card className="p-6 sm:p-8 flex flex-col gap-6 border border-border/80 bg-card shadow-sm rounded-2xl">
      <div>
        <h2 className="text-base font-semibold text-foreground leading-snug">{question.text}</h2>
      </div>

      {/* Question Diagram / Schematic Image */}
      {safeImageUrl && (
        <div className="flex flex-col gap-2">
          <div
            onClick={() => setIsZoomed(true)}
            className="group relative flex items-center justify-center p-3 sm:p-4 rounded-xl border border-border/70 bg-card/60 dark:bg-zinc-950/80 overflow-hidden cursor-zoom-in hover:border-primary/50 transition-colors"
          >
            <img
              src={safeImageUrl}
              alt="Question diagram"
              className={cn(
                "max-h-64 sm:max-h-72 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]",
                shouldInvert && "dark:invert"
              )}
              loading="eager"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-xs text-[11px] font-semibold text-muted-foreground px-2 py-1 rounded-md border border-border/60 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>Enlarge</span>
            </div>
          </div>

          {/* Lightbox Zoom Modal */}
          {isZoomed && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 sm:p-8 animate-fade-in"
              onClick={() => setIsZoomed(false)}
            >
              <div
                className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Question Diagram
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZoomed(false)}
                    className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Close image preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[75vh] w-full overflow-auto flex items-center justify-center bg-card/60 dark:bg-zinc-950/80 p-4 rounded-xl border border-border/40">
                  <img
                    src={safeImageUrl}
                    alt="Question diagram full view"
                    className={cn(
                      "max-h-[70vh] max-w-full object-contain",
                      shouldInvert && "dark:invert"
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Answer Options */}
      <div className="flex flex-col gap-3" role="group" aria-label="Answer options">
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
              onClick={() => onOptionClick(opt)}
              disabled={!!selectedOption}
              className={cn(
                "w-full text-left p-4 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer select-none active:scale-[0.99] duration-100 outline-hidden font-medium",
                optionClass
              )}
              aria-pressed={isSelected}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation Box post answering */}
      {selectedOption && question.description && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3 select-none">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Sparkles className="h-4 w-4" />
            <span>Answer Explanation:</span>
          </div>
          <div className="flex flex-col gap-2 text-xs text-foreground/90 leading-relaxed font-medium">
            {question.description.split("\n").flatMap((line: string) =>
              splitSentences(line).map((part: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <span>{part}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-2 relative select-none">
        {question.hint ? (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 border border-border/80 bg-surface rounded-lg",
                showHint && "bg-secondary text-primary"
              )}
              onClick={onToggleHint}
              aria-label="Hint"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>

            {showHint && (
              <div className="absolute left-0 bottom-12 z-20 w-64 bg-card border border-border/80 p-4 rounded-xl shadow-lg animate-slide-in-bottom">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-primary">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Hint</span>
                  </span>
                  <button
                    onClick={onToggleHint}
                    className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  {question.hint}
                </p>
              </div>
            )}
          </div>
        ) : (
          <span />
        )}

        <Button
          variant="primary"
          disabled={!selectedOption || isSubmitting}
          onClick={onNext}
          className="h-10 px-5 font-bold gap-2 text-xs shadow-xs min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Finishing...</span>
            </>
          ) : (
            <span>{isLastQuestion ? "Finish Quiz" : "Next Question"}</span>
          )}
        </Button>
      </div>
    </Card>
  );
}

export const QuizQuestionCard = memo(QuizQuestionCardInner);
export default QuizQuestionCard;
