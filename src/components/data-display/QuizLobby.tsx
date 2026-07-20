"use client";

import { memo } from "react";
import { Play, RotateCcw, BookOpen, Share2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { QuizLeaderboard } from "@/components/data-display/QuizLeaderboard";

import type { LeaderboardEntry } from "@/lib/services/attempt.service";

interface QuizLobbyProps {
  quiz: {
    id: string;
    title: string;
    difficulty: string;
    questions: { id: string }[];
  };
  authWarning: string | null;
  activeAttempt: {
    attemptId: string;
    answers: { questionId: string }[];
  } | null;
  leaderboard: LeaderboardEntry[];
  loadingLeaderboard?: boolean;
  onStart: (forceNew: boolean, resumeAttemptId?: string) => void;
  resolveShareUrl: () => Promise<string>;
}

const difficultyBadgeVariant = (difficulty: string) => {
  const diff = difficulty.toLowerCase();
  if (diff === "easy") return "success";
  if (diff === "medium") return "warning";
  if (diff === "hard") return "danger";
  return "default";
};

function QuizLobbyInner({
  quiz,
  authWarning,
  activeAttempt,
  leaderboard,
  loadingLeaderboard,
  onStart,
  resolveShareUrl,
}: QuizLobbyProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
      <Card className="p-6 sm:p-8 text-center flex flex-col items-center gap-5 border border-border/80 bg-card shadow-sm rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center shrink-0 shadow-xs">
          <BookOpen className="h-6 w-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{quiz.title}</h1>
          <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground font-semibold flex-wrap">
            <span>Difficulty:</span>
            <Badge
              variant={difficultyBadgeVariant(quiz.difficulty)}
              className="capitalize font-bold px-1.5 py-0.5 text-[10px]"
            >
              {quiz.difficulty}
            </Badge>
            <span className="opacity-40 select-none">·</span>
            <span>Total Questions:</span>
            <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-bold">
              {quiz.questions.length}
            </Badge>
          </div>
        </div>

        {authWarning && (
          <div className="w-full rounded-lg border border-warning/20 bg-warning/10 p-3.5 text-xs font-semibold text-warning text-left">
            {authWarning}
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full justify-center max-w-sm mt-2">
          {activeAttempt ? (
            <>
              <Button
                variant="primary"
                onClick={() => onStart(false, activeAttempt.attemptId)}
                className="flex-1 h-10 font-bold gap-2 text-xs"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Resume Quiz (Q{activeAttempt.answers.length + 1})</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onStart(true)}
                className="h-10 px-4 font-semibold text-xs border border-border/80 hover:bg-surface-hover gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restart</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2.5 w-full">
              <Button
                variant="primary"
                onClick={() => onStart(false)}
                className="flex-1 h-10 font-bold gap-2 text-xs shadow-xs"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Start Quiz</span>
              </Button>

              <ShareButton
                icon={<Share2 className="h-4 w-4" />}
                buttonAppearance="outline"
                buttonSize="icon"
                buttonClassName="h-10 w-10 shrink-0 border border-border/80 bg-surface rounded-lg"
                shareText={`Check out this quiz: ${quiz.title} on Quizzer!`}
                defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${quiz.id}`}
                resolveUrl={resolveShareUrl}
              />
            </div>
          )}
        </div>
      </Card>

      <QuizLeaderboard
        leaderboard={leaderboard}
        loading={loadingLeaderboard}
        title="Top 10 Rankings"
      />
    </div>
  );
}

export const QuizLobby = memo(QuizLobbyInner);
export default QuizLobby;