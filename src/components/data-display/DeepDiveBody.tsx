"use client";

import { Brain, BookOpen } from "lucide-react";

import { NoData } from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeepDiveBodyProps } from "@/components/data-display/interfaces/DeepDiveBody.interface";
import { MarkdownContent } from "@/components/data-display/MarkdownContent";
import { QuestionText } from "@/components/data-display/QuestionText";

/**
 * DeepDiveBody component displays the full detail of a deep dive,
 * including question banner, topic, quiz title/difficulty, correct answer,
 * and the AI-generated elaboration content with KaTeX math and Markdown formatting.
 */
export function DeepDiveBody({ question }: DeepDiveBodyProps) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-0 overflow-hidden border border-border/80 shadow-sm rounded-2xl">
        {/* Gradient banner */}
        <div className="bg-linear-to-br from-primary to-accent p-6 sm:p-7 flex items-start gap-4 text-primary-foreground">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs border border-white/10">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <QuestionText text={question.text} size="lg" className="text-white [&_*]:text-white" />
          </div>
        </div>

        {/* Meta + details row */}
        <div className="px-6 py-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 text-sm bg-secondary/10 transition-colors">
          <div className="flex flex-wrap items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground/90">
              {question.topic.title === "__internal__" ? "General" : question.topic.title}
            </span>
            {question.quiz && (
              <>
                <span className="text-muted-foreground/60 select-none">·</span>
                <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 whitespace-nowrap">
                  {question.quiz.title}
                </Badge>
                <Badge variant={difficultyBadgeVariant(question.quiz.difficulty)} className="capitalize font-bold">
                  {question.quiz.difficulty}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Correct answer */}
        <div className="px-6 py-3.5 bg-success/10 text-success border-t border-border/30 text-sm">
          <span className="font-medium">
            <strong className="font-bold">✓ Correct Answer:</strong> {question.correctAnswer}
          </span>
        </div>
      </Card>

      {/* Elaboration content */}
      {question.elaboration ? (
        <Card className="p-6 sm:p-10 border-border/80 shadow-xs">
          <MarkdownContent content={question.elaboration} className="text-sm sm:text-base leading-relaxed" />
        </Card>
      ) : (
        <NoData
          title="No elaboration saved yet."
          description="Use the 🤖 AI Deep Dive button in quiz results to generate one."
          icon="brain"
        />
      )}
    </div>
  );
}
