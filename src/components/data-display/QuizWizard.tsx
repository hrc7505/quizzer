"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Timer, 
  BookOpen, 
  Lightbulb, 
  Check, 
  Loader2, 
  X,
  Share2,
} from "lucide-react";

import { AttemptService } from "@/lib/services/attempt.service";
import { splitSentences, formatTime } from "@/lib/text";
import { ShareButton } from "@/components/ui/ShareButton";
import { Alert } from "@/components/ui/Alert";
import NoData from "@/components/feedback/NoData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

interface QuizWizardQuestion {
  id: string;
  text: string;
  hint?: string | null;
  description?: string | null;
  options: string[];
  correctAnswer: string;
}

interface QuizWizardAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface QuizWizardQuiz {
  id: string;
  title: string;
  difficulty: string;
  questions: QuizWizardQuestion[];
}

interface QuizWizardAttempt {
  attemptId: string;
  quizId: string;
  answers: QuizWizardAnswer[];
  timeTakenSec: number;
}

export function QuizWizard({ quiz }: { quiz: QuizWizardQuiz }) {
  type AttemptLeaderboardEntry = import("@/lib/services/attempt.service").LeaderboardEntry;

  const router = useRouter();
  const { status } = useSession();
  const saveControllerRef = useRef<AbortController | null>(null);
  const lastSaveSequenceRef = useRef(0);
  const pendingSavePromiseRef = useRef<Promise<void> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<QuizWizardAttempt | null>(null);
  const [attemptId, setAttemptId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<AttemptLeaderboardEntry[]>([]);

  // Gameplay State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<QuizWizardAnswer[]>([]);

  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  // 1. Initial Load: Check for in-progress attempts and retrieve quiz leaderboard
  useEffect(() => {
    let cancelled = false;
    const initData = async () => {
      if (status === "loading") return;
      setError(null);
      if (status === "unauthenticated") {
        setLoading(false);
        setAuthWarning("Sign in to save progress and start this quiz.");
        try {
          const leaderboardData = await AttemptService.getLeaderboard(quiz.id);
          if (!cancelled) setLeaderboard(leaderboardData);
        } catch (err) {
          if (!cancelled) console.error("Failed to load leaderboard:", err);
        }
        return;
      }

      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, createOnNotFound: false }),
        });
        const attemptData = await res.json();
        
        if (attemptData.success && attemptData.attemptId && attemptData.answers && attemptData.answers.length > 0) {
          if (!cancelled) setActiveAttempt(attemptData);
        }

        const leaderboardData = await AttemptService.getLeaderboard(quiz.id);
        if (!cancelled) setLeaderboard(leaderboardData);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to initialize quiz metadata:", err);
          setError("Failed to load quiz data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initData();
    return () => { cancelled = true; };
  }, [quiz.id, status]);

  // 2. Play Timer: Increments every second once play is active
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setTimeTaken(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleStart = async (forceNew: boolean, resumeAttemptId?: string) => {
    if (status === "unauthenticated") {
      setAuthWarning("Please sign in to start this quiz.");
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setAuthWarning(null);
    setError(null);
    setLoading(true);
    try {
      if (!forceNew && resumeAttemptId && activeAttempt) {
        setAttemptId(resumeAttemptId);
        const formattedAnswers: QuizWizardAnswer[] = activeAttempt.answers.map((ans) => ({
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isCorrect: ans.isCorrect,
        }));

        setAnswers(formattedAnswers);
        setTimeTaken(activeAttempt.timeTakenSec || 0);
        setCurrentIndex(formattedAnswers.length);
        setSelectedOption(null);
        setShowHint(false);
        setIsPlaying(true);
        return;
      }

      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, forceNew }),
      });
      const data = await res.json();

      if (data.success) {
        setAttemptId(data.attemptId);
        
        if (!forceNew && data.answers && data.answers.length > 0) {
          const formattedAnswers: QuizWizardAnswer[] = data.answers.map((ans: QuizWizardAnswer) => ({
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect
          }));

          setAnswers(formattedAnswers);
          setTimeTaken(data.timeTakenSec);
          setCurrentIndex(formattedAnswers.length);
        } else {
          setAnswers([]);
          setTimeTaken(0);
          setCurrentIndex(0);
        }

        setSelectedOption(null);
        setShowHint(false);
        setIsPlaying(true);
      } else {
        setError(data.error || "Failed to initialize quiz attempt.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
  };

  const saveAnswerInBackground = async (answer: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }) => {
    lastSaveSequenceRef.current += 1;

    if (saveControllerRef.current) {
      saveControllerRef.current.abort();
    }

    const controller = new AbortController();
    saveControllerRef.current = controller;

    const savePromise = AttemptService.saveAnswer(
      attemptId,
      answer.questionId,
      answer.selectedAnswer,
      answer.isCorrect,
      timeTaken,
      controller.signal
    )
      .then(() => undefined)
      .catch((error) => {
        if (error?.name === "AbortError") {
          return;
        }
        console.error("Failed to save answer progress:", error);
      });

    pendingSavePromiseRef.current = savePromise;
    return savePromise;
  };

  const handleNext = async () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const currentAnswerObj = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect,
    };

    const newAnswers = [...answers, currentAnswerObj];
    setAnswers(newAnswers);

    const savePromise = saveAnswerInBackground(currentAnswerObj);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      setIsSubmitting(true);
      setError(null);
      try {
        await savePromise;
        const res = await AttemptService.completeAttempt(attemptId, timeTaken);
        if (res.success) {
          router.push(`/quiz/results/${res.attemptId}`);
        } else {
          setError("Failed to submit attempt");
        }
      } catch {
        setError("An error occurred while finalizing quiz.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resolveShareUrl = async () => {
    const origin = window.location.origin;
    let shareUrl = `${origin}/quiz/${quiz.id}`;

    try {
      const res = await fetch(`/api/quiz/${quiz.id}/share-url`);
      if (res.ok) {
        const json = await res.json();
        if (json?.url) shareUrl = `${origin}${json.url}`;
      }
    } catch {
      // keep fallback
    }

    return shareUrl;
  };

  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "default";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-sm text-muted-foreground select-none">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span>Loading quiz details…</span>
      </div>
    );
  }

  // Lobby/Start screen
  if (!isPlaying) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
        <Card className="p-6 sm:p-8 text-center flex flex-col items-center gap-5 border border-border/80 bg-card shadow-sm rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{quiz.title}</h1>
            <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground font-semibold flex-wrap">
              <span>Difficulty:</span>
              <Badge variant={difficultyBadgeVariant(quiz.difficulty)} className="capitalize font-bold px-1.5 py-0.5 text-[10px]">
                {quiz.difficulty}
              </Badge>
              <span className="opacity-40 select-none">·</span>
              <span>Total Questions:</span>
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-bold">
                {questions.length}
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
                  onClick={() => handleStart(false, activeAttempt.attemptId)}
                  className="flex-1 h-10 font-bold gap-2 text-xs"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume Quiz (Q{activeAttempt.answers.length + 1})</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStart(true)}
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
                  onClick={() => handleStart(false)}
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

        {/* Leaderboard */}
        <Card className="p-6 border-border/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Trophy className="h-5 w-5 text-warning shrink-0" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">Top 10 Rankings</h2>
          </div>

          {leaderboard.length === 0 ? (
            <NoData
              title="No rankings available yet."
              description="Be the first to top the leaderboard!"
              icon="sparkle"
              compact
            />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-bold">
                    <th scope="col" className="py-2.5 px-3 w-16 text-center">Rank</th>
                    <th scope="col" className="py-2.5 px-2">Player</th>
                    <th scope="col" className="py-2.5 px-2 text-center w-20">Score</th>
                    <th scope="col" className="py-2.5 px-2 text-center w-20">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    let badgeClass = "bg-secondary text-secondary-foreground";
                    if (index === 0) badgeClass = "bg-amber-500 text-white font-black shadow-xs shadow-amber-500/25";
                    else if (index === 1) badgeClass = "bg-slate-400 text-white font-black shadow-xs shadow-slate-400/25";
                    else if (index === 2) badgeClass = "bg-amber-700 text-white font-black shadow-xs shadow-amber-700/25";

                    return (
                      <tr key={entry.userId} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px]",
                            badgeClass
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {entry.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={entry.image} alt={entry.name} className="h-5 w-5 rounded-full object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={cn("truncate font-medium text-foreground", index < 3 && "font-semibold")}>
                              {entry.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "font-bold",
                            (entry.scorePercentage ?? 0) >= 80 
                              ? "text-success" 
                              : (entry.scorePercentage ?? 0) >= 50 
                                ? "text-warning" 
                                : "text-danger"
                          )}>
                            {Math.round(entry.scorePercentage ?? 0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground/80 font-medium">
                          {formatTime(entry.timeTakenSec ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Progress calculations
  const progress = currentIndex / questions.length;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
      {/* Quiz Top Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4 select-none gap-3">
        <h1 className="text-lg font-bold text-foreground truncate pr-6">{quiz.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="default" className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            <Timer className="h-3.5 w-3.5" />
            <span>{formatTime(timeTaken)}</span>
          </Badge>
          <ShareButton
            icon={<Share2 className="h-4 w-4" />}
            buttonAppearance="outline"
            buttonSize="icon"
            buttonClassName="h-9 w-9 shrink-0 border border-border/80 bg-surface rounded-lg"
            shareText={`Check out this quiz: ${quiz.title} on Quizzer!`}
            defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${quiz.id}`}
            resolveUrl={resolveShareUrl}
          />
        </div>
      </div>

      {/* Progress tracking */}
      <div className="flex flex-col gap-2 select-none">
        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress * 100)}% Complete</span>
        </div>
        <Progress value={progress * 100} indicatorClassName="bg-primary" />
      </div>

        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

      {/* Question playing Card */}
      {currentQuestion && (
        <Card className="p-6 sm:p-8 flex flex-col gap-6 border border-border/80 bg-card shadow-sm rounded-2xl">
          <div>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="flex flex-col gap-3" role="group" aria-label="Answer options">
            {currentQuestion.options.map((opt: string, i: number) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = currentQuestion.correctAnswer === opt;
              
              let optionClass = "border-border/85 bg-card hover:bg-surface-hover hover:border-border text-foreground";

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
                  onClick={() => handleOptionClick(opt)}
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
          {selectedOption && currentQuestion.description && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3 select-none">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Answer Explanation:</span>
              </div>
              <div className="flex flex-col gap-2 text-xs text-foreground/90 leading-relaxed font-medium">
                {currentQuestion.description.split("\n").flatMap((line: string) =>
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
            {currentQuestion.hint ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 border border-border/80 bg-surface rounded-lg",
                    showHint && "bg-secondary text-primary"
                  )}
                  onClick={() => setShowHint(!showHint)}
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
                        onClick={() => setShowHint(false)} 
                        className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{currentQuestion.hint}</p>
                  </div>
                )}
              </div>
            ) : (
              <span />
            )}

            <Button 
              variant="primary" 
              disabled={!selectedOption || isSubmitting} 
              onClick={handleNext}
              className="h-10 px-5 font-bold gap-2 text-xs shadow-xs min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>
                  {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                </span>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
