"use client";

import { Loader2, Timer, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import { ShareButton } from "@/components/ui/ShareButton";
import { formatTime } from "@/lib/text";
import { useQuizWizard } from "@/hooks/useQuizWizard";
import { QuizLobby } from "./QuizLobby";
import { QuizQuestionCard } from "./QuizQuestionCard";

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
        resolveShareUrl={actions.resolveShareUrl}
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
          <ShareButton
            icon={<Share2 className="h-4 w-4" />}
            buttonAppearance="outline"
            buttonSize="icon"
            buttonClassName="h-9 w-9 shrink-0 border border-border/80 bg-surface rounded-lg"
            shareText={`Check out this quiz: ${quiz.title} on Quizzer!`}
            defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${quiz.id}`}
            resolveUrl={actions.resolveShareUrl}
          />
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

      {state.error && (
        <Alert variant="danger" title="Error">
          {state.error}
        </Alert>
      )}

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