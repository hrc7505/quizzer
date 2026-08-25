"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import { AttemptService } from "@/lib/services/attempt.service";

import type { LeaderboardEntry } from "@/lib/services/attempt.service";

interface QuizWizardQuestion {
  id: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
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

import { soundEffects } from "@/lib/services/sound-effects.service";
import type { CelebrationBurst, StreakMilestone } from "@/components/feedback/TelegramQuizCelebration";

export interface QuizWizardState {
  loading: boolean;
  isPlaying: boolean;
  authWarning: string | null;
  activeAttempt: QuizWizardAttempt | null;
  attemptId: string;
  leaderboard: LeaderboardEntry[];
  currentIndex: number;
  selectedOption: string | null;
  showHint: boolean;
  answers: QuizWizardAnswer[];
  timeTaken: number;
  isSubmitting: boolean;
  error: string | null;
  currentQuestion: QuizWizardQuestion | null;
  questions: QuizWizardQuestion[];
  progress: number;
  streakCount: number;
  celebrationBurst: CelebrationBurst | null;
  streakMilestone: StreakMilestone | null;
}

export interface QuizWizardActions {
  handleStart: (forceNew: boolean, resumeAttemptId?: string) => Promise<void>;
  handleOptionClick: (option: string, origin?: { x: number; y: number }) => void;
  handleNext: () => Promise<void>;
  setShowHint: (show: boolean) => void;
  clearMilestone: () => void;
}

export function useQuizWizard(quiz: QuizWizardQuiz): [QuizWizardState, QuizWizardActions] {
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<QuizWizardAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = quiz.questions || [];
  const safeIndex = questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQuestion = questions[safeIndex] || null;
  const progress = questions.length > 0 ? Math.min(1, safeIndex / questions.length) : 0;

  // Initial Load
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

        if (
          attemptData.success &&
          attemptData.attemptId &&
          attemptData.answers &&
          attemptData.answers.length > 0
        ) {
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
    return () => {
      cancelled = true;
    };
  }, [quiz.id, status]);

  // Play Timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setTimeTaken((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const saveAnswerInBackground = useCallback(
    async (answer: { questionId: string; selectedAnswer: string; isCorrect: boolean }) => {
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
        .catch((err) => {
          if (err?.name === "AbortError") return;
          console.error("Failed to save answer progress:", err);
        });

      pendingSavePromiseRef.current = savePromise;
      return savePromise;
    },
    [attemptId, timeTaken]
  );

  const handleStart = useCallback(
    async (forceNew: boolean, resumeAttemptId?: string) => {
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
            const formattedAnswers: QuizWizardAnswer[] = data.answers.map(
              (ans: QuizWizardAnswer) => ({
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                isCorrect: ans.isCorrect,
              })
            );

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
    },
    [status, activeAttempt, quiz.id]
  );

  const [streakCount, setStreakCount] = useState(0);
  const [celebrationBurst, setCelebrationBurst] = useState<CelebrationBurst | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<StreakMilestone | null>(null);

  const clearMilestone = useCallback(() => {
    setStreakMilestone(null);
  }, []);

  const handleOptionClick = useCallback(
    (option: string, origin?: { x: number; y: number }) => {
      if (selectedOption || !currentQuestion) return;

      setSelectedOption(option);

      const isCorrect = option === currentQuestion.correctAnswer;
      if (isCorrect) {
        const nextStreak = streakCount + 1;
        setStreakCount(nextStreak);

        // Trigger Telegram-style firecracker burst
        const defaultX = typeof window !== "undefined" ? window.innerWidth / 2 : 400;
        const defaultY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
        setCelebrationBurst({
          id: Date.now(),
          x: origin?.x ?? defaultX,
          y: origin?.y ?? defaultY,
        });

        // Check for streak milestone celebrations
        if (nextStreak === 3) {
          setStreakMilestone({
            streak: 3,
            title: "3 In A Row!",
            message: "You're on fire! Keep it going! 🔥",
            icon: "fire",
          });
          soundEffects.playStreakCelebrationSound(3);
        } else if (nextStreak === 5) {
          setStreakMilestone({
            streak: 5,
            title: "5 Streak!",
            message: "Unstoppable knowledge! ⚡",
            icon: "zap",
          });
          soundEffects.playStreakCelebrationSound(5);
        } else if (nextStreak > 5 && nextStreak % 5 === 0) {
          setStreakMilestone({
            streak: nextStreak,
            title: `${nextStreak} Combo Streak!`,
            message: "Absolute Quiz Master! 🏆",
            icon: "trophy",
          });
          soundEffects.playStreakCelebrationSound(nextStreak);
        } else {
          soundEffects.playCorrectSound();
        }
      } else {
        setStreakCount(0);
        soundEffects.playWrongSound();
      }
    },
    [selectedOption, currentQuestion, streakCount]
  );

  const handleNext = useCallback(async () => {
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
  }, [
    selectedOption,
    currentQuestion,
    answers,
    saveAnswerInBackground,
    currentIndex,
    questions.length,
    attemptId,
    timeTaken,
    router,
  ]);

  const state: QuizWizardState = {
    loading,
    isPlaying,
    authWarning,
    activeAttempt,
    attemptId,
    leaderboard,
    currentIndex,
    selectedOption,
    showHint,
    answers,
    timeTaken,
    isSubmitting,
    error,
    currentQuestion,
    questions,
    progress,
    streakCount,
    celebrationBurst,
    streakMilestone,
  };

  const actions: QuizWizardActions = {
    handleStart,
    handleOptionClick,
    handleNext,
    setShowHint,
    clearMilestone,
  };

  return [state, actions];
}
