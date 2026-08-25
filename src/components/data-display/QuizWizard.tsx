"use client";

import { useState, useEffect } from "react";
import { Loader2, Timer, Maximize, Minimize, Volume2, VolumeX, Flame, Zap } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/text";
import { useQuizWizard } from "@/hooks/useQuizWizard";
import { QuizLobby } from "@/components/data-display/QuizLobby";
import { QuizQuestionCard } from "@/components/data-display/QuizQuestionCard";
import { TelegramQuizCelebration } from "@/components/feedback/TelegramQuizCelebration";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { cn } from "@/utils/cn";

interface QuizWizardQuestion {
  id: string;
  sourceQuestionId?: string | null;
  language?: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
  hint?: string | null;
  description?: string | null;
  options: string[];
  correctAnswer: string;
  createdAt?: Date | string;
}

interface QuizWizardQuiz {
  id: string;
  title: string;
  difficulty: string;
  questions: QuizWizardQuestion[];
}

export function QuizWizard({ quiz }: { quiz: QuizWizardQuiz }) {
  const getTime = (q: unknown) => {
    const d = (q as { createdAt?: Date | string })?.createdAt;
    return d ? new Date(d).getTime() : 0;
  };

  // 1. Base canonical English questions
  const enQuestions = quiz.questions
    .filter(
      (q) =>
        q.language === "en" ||
        (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text))
    )
    .sort((a, b) => getTime(a) - getTime(b));

  // 2. Build Gujarati track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const guMap = new Map<string, QuizWizardQuestion>();
  const guUnmapped: QuizWizardQuestion[] = [];
  for (const q of quiz.questions) {
    if (q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text))) {
      if (q.sourceQuestionId) {
        guMap.set(q.sourceQuestionId, q);
      } else {
        guUnmapped.push(q);
      }
    }
  }

  const guQuestions =
    enQuestions.length > 0 && (guMap.size > 0 || guUnmapped.length > 0)
      ? enQuestions.map((enQ, idx) => guMap.get(enQ.id) || guUnmapped[idx] || enQ)
      : quiz.questions
          .filter((q) => q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text)))
          .sort((a, b) => getTime(a) - getTime(b));

  // 3. Build Hindi track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const hiMap = new Map<string, QuizWizardQuestion>();
  const hiUnmapped: QuizWizardQuestion[] = [];
  for (const q of quiz.questions) {
    if (q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text))) {
      if (q.sourceQuestionId) {
        hiMap.set(q.sourceQuestionId, q);
      } else {
        hiUnmapped.push(q);
      }
    }
  }

  const hiQuestions =
    enQuestions.length > 0 && (hiMap.size > 0 || hiUnmapped.length > 0)
      ? enQuestions.map((enQ, idx) => hiMap.get(enQ.id) || hiUnmapped[idx] || enQ)
      : quiz.questions
          .filter((q) => q.language === "hi")
          .sort((a, b) => getTime(a) - getTime(b));

  const availableLanguages = [
    ...(enQuestions.length > 0
      ? [{ code: "en", label: "English", flag: "🇺🇸", count: enQuestions.length }]
      : []),
    ...(guQuestions.length > 0 && guMap.size + guUnmapped.length > 0
      ? [{ code: "gu", label: "ગુજરાતી", flag: "🇮🇳", count: guQuestions.length }]
      : []),
    ...(hiQuestions.length > 0 && hiMap.size + hiUnmapped.length > 0
      ? [{ code: "hi", label: "हिन्दी", flag: "🇮🇳", count: hiQuestions.length }]
      : []),
  ];

  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return availableLanguages[0]?.code || "en";
  });

  const activeQuestions =
    selectedLang === "gu" && guQuestions.length > 0
      ? guQuestions
      : selectedLang === "hi" && hiQuestions.length > 0
      ? hiQuestions
      : enQuestions.length > 0
      ? enQuestions
      : quiz.questions;

  const activeQuiz = {
    ...quiz,
    questions: activeQuestions,
  };

  const [state, actions] = useQuizWizard(activeQuiz);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());

  const toggleSound = () => {
    const next = !soundEnabled;
    soundEffects.setEnabled(next);
    setSoundEnabled(next);
  };

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
        quiz={activeQuiz}
        availableLanguages={availableLanguages}
        selectedLanguage={selectedLang}
        onSelectLanguage={setSelectedLang}
        authWarning={state.authWarning}
        activeAttempt={state.activeAttempt}
        leaderboard={state.leaderboard}
        onStart={actions.handleStart}
      />
    );
  }

  return (
    <div className="relative flex flex-col gap-6 max-w-2xl mx-auto py-4">
      {/* Telegram-style Firecrackers & Streak Celebration Overlay */}
      <TelegramQuizCelebration
        burst={state.celebrationBurst}
        milestone={state.streakMilestone}
        onClearMilestone={actions.clearMilestone}
      />

      {/* Quiz Top Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4 select-none gap-3">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <h1 className="text-lg font-bold text-foreground truncate">{quiz.title}</h1>
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-1 p-0.5 bg-surface-hover rounded-lg border border-border/60 shrink-0">
              {availableLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSelectedLang(l.code)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                    selectedLang === l.code
                      ? "bg-card shadow-2xs text-foreground ring-1 ring-border/40"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`Switch to ${l.label}`}
                >
                  <span>{l.flag}</span>
                  <span className="ml-1 hidden sm:inline">{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Consecutive Correct Streak Badge */}
          {state.streakCount >= 2 && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all animate-scale-in shadow-xs",
                state.streakCount >= 5
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              )}
            >
              {state.streakCount >= 5 ? (
                <Zap className="h-3.5 w-3.5 fill-blue-500 animate-pulse" />
              ) : (
                <Flame className="h-3.5 w-3.5 fill-amber-500 animate-bounce" />
              )}
              <span>{state.streakCount} Streak</span>
            </div>
          )}

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 border border-border/80 bg-surface rounded-lg text-muted-foreground hover:text-foreground"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
            title={soundEnabled ? "Mute sound" : "Enable sound"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground/60" />
            )}
          </Button>

          {/* Timer */}
          <Badge
            variant="default"
            className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold"
          >
            <Timer className="h-3.5 w-3.5" />
            <span>{formatTime(state.timeTaken)}</span>
          </Badge>

          {/* Fullscreen Toggle */}
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