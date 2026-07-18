"use client";

import { Brain, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { NoData } from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeepDiveBodyProps } from "./interfaces/DeepDiveBody.interface";

/**
 * DeepDiveBody component displays the full detail of a deep dive,
 * including question banner, topic, quiz title/difficulty, correct answer,
 * and the AI-generated elaboration content.
 */
export function DeepDiveBody({ question }: DeepDiveBodyProps) {
  
  // Custom difficulty color mapper for Tailwind-styled badges
  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "default";
  };

  return (
    <div className="flex flex-col gap-6 w-full py-2">
      {/* Header card */}
      <Card className="border-border/80 bg-card overflow-hidden shadow-sm p-0">
        {/* Gradient banner */}
        <div className="bg-gradient-to-br from-primary to-accent p-6 sm:p-7 flex items-start gap-4 text-primary-foreground">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm border border-white/10">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight leading-snug text-white">
              {question.text}
            </h2>
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
        <Card className="p-8 sm:p-10 border-border/80 shadow-xs">
          <div className="markdown-body prose dark:prose-invert max-w-none text-foreground/95">
            <ReactMarkdown>{question.elaboration}</ReactMarkdown>
          </div>
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
