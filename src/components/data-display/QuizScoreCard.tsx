"use client";

import { memo } from "react";

import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/utils/cn";

interface QuizScoreCardProps {
  title: string;
  scorePercentage: number;
  correctCount: number;
  wrongCount: number;
  timeTakenSec: number;
}

function QuizScoreCardInner({
  title,
  scorePercentage,
  correctCount,
  wrongCount,
  timeTakenSec,
}: QuizScoreCardProps) {
  const rounded = Math.round(scorePercentage);
  const scoreIndicatorClass =
    rounded === 100
      ? "bg-amber-400"
      : rounded >= 90
        ? "bg-purple-500"
        : rounded >= 75
          ? "bg-emerald-500"
          : rounded >= 50
            ? "bg-blue-500"
            : rounded >= 25
              ? "bg-amber-500"
              : "bg-red-500";

  const scoreTextClass =
    rounded === 100
      ? "text-amber-400 font-black drop-shadow-xs"
      : rounded >= 90
        ? "text-purple-500 font-extrabold"
        : rounded >= 75
          ? "text-emerald-500 font-bold"
          : rounded >= 50
            ? "text-blue-500 font-bold"
            : rounded >= 25
              ? "text-amber-500 font-bold"
              : "text-red-500 font-bold";

  return (
    <Card className="p-6 border-border/80 shadow-xs flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Quiz Title
        </span>
        <span className="text-base font-bold text-foreground leading-snug">{title}</span>
      </div>

      <div className="flex flex-col items-center justify-center py-6 border border-border/40 rounded-2xl bg-secondary/5">
        <span className={cn("text-5xl font-semibold tracking-tight", scoreTextClass)}>
          {Math.round(scorePercentage)}%
        </span>
        <span className="text-xs font-semibold text-muted-foreground/80 mt-1 uppercase tracking-wider">
          Final Score
        </span>
      </div>

      <div className="w-full">
        <Progress value={scorePercentage} indicatorClassName={scoreIndicatorClass} />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/30 pt-4 mt-1 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Correct</span>
          <span className="text-base font-bold text-success">{correctCount}</span>
        </div>
        <div className="flex flex-col gap-0.5 border-l border-r border-border/40">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Incorrect</span>
          <span className="text-base font-bold text-danger">{wrongCount}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Time Taken</span>
          <span className="text-base font-bold text-foreground">
            {Math.floor(timeTakenSec / 60)}m {timeTakenSec % 60}s
          </span>
        </div>
      </div>
    </Card>
  );
}

export const QuizScoreCard = memo(QuizScoreCardInner);
export default QuizScoreCard;