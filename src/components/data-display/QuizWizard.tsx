"use client";

import { useState, useEffect } from "react";
import { Loader2, Timer, Maximize, Minimize } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/text";
import { useQuizWizard } from "@/hooks/useQuizWizard";
import { QuizLobby } from "@/components/data-display/QuizLobby";
import { QuizQuestionCard } from "@/components/data-display/QuizQuestionCard";

interface QuizWizardQuestion {
  id: string;
  text: string;
  hint?: string | null;
  description?: string | null;
  options: string[];
  correctAnswer: string;
}

interface QuizWizardQuiz {
  id: string;
  title: string;
  difficulty: string;
  questions: QuizWizardQuestion[];
}

export function QuizWizard({ quiz }: { quiz: QuizWizardQuiz }) {
  const [state, actions] = useQuizWizard(quiz);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-sm text-muted-foreground select-none">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span>Loading quiz details…</span>
      </div>
    );
  }

  // Lobby/Start screen
  if (!state.isPlaying) {
    return (
      <QuizLobby
        quiz={quiz}
        authWarning={state.authWarning}
        activeAttempt={state.activeAttempt}
        leaderboard={state.leaderboard}
        onStart={actions.handleStart}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
      {/* Quiz Top Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4 select-none gap-3">
        <h1 className="text-lg font-bold text-foreground truncate pr-6">{quiz.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="default"
            className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold"
          >
            <Timer className="h-3.5 w-3.5" />
            <span>{formatTime(state.timeTaken)}</span>
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 border border-border/80 bg-surface rounded-lg text-muted-foreground hover:text-foreground"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress tracking */}
      <div className="flex flex-col gap-2 select-none">
        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
          <span>
            Question {state.currentIndex + 1} of {state.questions.length}
          </span>
          <span>{Math.round(state.progress * 100)}% Complete</span>
        </div>
        <Progress value={state.progress * 100} indicatorClassName="bg-primary" />
      </div>

      {/* Question playing Card */}
      {state.currentQuestion && (
        <QuizQuestionCard
          question={state.currentQuestion}
          selectedOption={state.selectedOption}
          showHint={state.showHint}
          onOptionClick={actions.handleOptionClick}
          onToggleHint={() => actions.setShowHint(!state.showHint)}
          onNext={actions.handleNext}
          isSubmitting={state.isSubmitting}
          isLastQuestion={state.currentIndex === state.questions.length - 1}
        />
      )}
    </div>
  );
}

export default QuizWizard;