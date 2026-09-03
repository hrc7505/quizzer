"use client";

import { Brain, BookOpen, Loader2 } from "lucide-react";

import { NoData } from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeepDiveBodyProps } from "@/components/data-display/interfaces/DeepDiveBody.interface";
import { MarkdownContent } from "@/components/data-display/MarkdownContent";
import { QuestionText } from "@/components/data-display/QuestionText";
import { OptionText } from "@/components/data-display/OptionText";
import { TRANSLATION_LANGUAGES_LIST } from "@/types/language";
import { cn } from "@/utils/cn";

/**
 * DeepDiveBody component displays the full detail of a deep dive,
 * including responsive question banner, metadata badges, language switcher,
 * and the AI-generated elaboration content with KaTeX math and Markdown formatting.
 */
export function DeepDiveBody({
  question,
  selectedLanguage,
  onSelectLanguage,
  loadingLanguage = false,
}: DeepDiveBodyProps) {
  // Custom difficulty color mapper for Tailwind-styled badges
  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "secondary";
  };

  if (!question) {
    return <NoData title="Question not found or has been removed." />;
  }

  const currentLang = selectedLanguage || question.language || "en";

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <Card className="p-0 overflow-hidden border border-border/80 shadow-sm rounded-2xl">
        {/* Gradient Question Banner */}
        <div className="bg-linear-to-br from-primary to-accent p-4 sm:p-6 flex items-start gap-3 sm:gap-4 text-primary-foreground">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs border border-white/10">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <QuestionText text={question.text} size="base" className="text-white [&_*]:text-white font-medium sm:text-lg leading-snug" />
          </div>
        </div>

        {/* Metadata Row */}
        <div className="px-4 sm:px-6 py-3 border-b border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm bg-secondary/10 transition-colors">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground/90 truncate">
              {question.topic.title === "__internal__" ? "General" : question.topic.title}
            </span>
          </div>

          {question.quiz && (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 text-[10px] sm:text-xs max-w-[160px] sm:max-w-[220px] truncate">
                {question.quiz.title}
              </Badge>
              <Badge variant={difficultyBadgeVariant(question.quiz.difficulty)} className="capitalize font-bold text-[10px] sm:text-xs">
                {question.quiz.difficulty}
              </Badge>
            </div>
          )}
        </div>

        {/* Dedicated Language Selector Strip */}
        {onSelectLanguage && (
          <div className="px-4 sm:px-6 py-2.5 bg-surface/60 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              Deep Dive Language
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-surface-hover/90 rounded-xl border border-border/60 select-none overflow-x-auto max-w-full">
              {TRANSLATION_LANGUAGES_LIST.map((langItem) => {
                const isSelected = currentLang === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    disabled={loadingLanguage}
                    onClick={() => onSelectLanguage(langItem.code)}
                    className={cn(
                      "flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap",
                      isSelected
                        ? "bg-card shadow-xs text-foreground ring-1 ring-border/40 font-extrabold"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                    )}
                    title={`View Deep Dive in ${langItem.label}`}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {langItem.glyph}
                    </span>
                    <span>{langItem.nativeLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Correct answer */}
        <div className="px-4 sm:px-6 py-3 bg-success/10 text-success border-t border-border/30 text-xs sm:text-sm">
          <div className="flex items-start sm:items-center gap-1.5 flex-wrap">
            <strong className="font-bold shrink-0">✓ Correct Answer:</strong>
            <OptionText text={question.correctAnswer} className="font-semibold text-foreground" />
          </div>
        </div>
      </Card>

      {/* Loading state when fetching or generating target language elaboration */}
      {loadingLanguage ? (
        <Card className="p-8 sm:p-12 border-border/80 shadow-xs flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              Formulating detailed concept breakdown…
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Translating and generating full academic deep dive with derivations and step-by-step reasoning.
            </span>
          </div>
        </Card>
      ) : question.elaboration ? (
        /* Elaboration content */
        <Card className="p-4 sm:p-8 border-border/80 shadow-xs">
          <MarkdownContent content={question.elaboration} className="text-xs sm:text-sm md:text-base leading-relaxed" />
        </Card>
      ) : (
        <NoData
          title="No elaboration saved yet."
          description="Click a language tab above to generate an AI Deep Dive."
          icon="brain"
        />
      )}
    </div>
  );
}
