"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Flame, 
  RotateCcw, 
  ArrowRight, 
  Play, 
  Pause,
  HelpCircle,
  Trophy
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import type { SampleQuizQuestion, QuizInteractiveAnimationProps } from "../interfaces/QuizAnimation.interface";

const SAMPLE_QUESTIONS: SampleQuizQuestion[] = [
  {
    id: "q1",
    subject: "Physics",
    topic: "Kinematics & Projectiles",
    question: "A projectile is launched with velocity v₀ at angle θ. What is its maximum flight height H?",
    options: [
      { id: "opt-1", label: "A", text: "H = (v₀² · sin θ) / g", isCorrect: false },
      { id: "opt-2", label: "B", text: "H = (v₀² · sin² θ) / 2g", isCorrect: true },
      { id: "opt-3", label: "C", text: "H = (2v₀ · sin θ) / g", isCorrect: false },
      { id: "opt-4", label: "D", text: "H = v₀² / (2g · cos θ)", isCorrect: false },
    ],
    explanation: {
      summary: "At maximum altitude, vertical velocity vy = 0.",
      whyCorrect: "Using vy² = (v₀ sin θ)² - 2gH, setting vy = 0 yields H = (v₀² sin² θ) / (2g).",
      whyWrong: "Option C calculates total time of flight T, not maximum vertical elevation.",
    },
    timeRemainingSec: 24,
  },
  {
    id: "q2",
    subject: "Mathematics",
    topic: "Differential Calculus",
    question: "What is the derivative of f(x) = x³ · ln(x) using the Product Rule for all x > 0?",
    options: [
      { id: "opt-1", label: "A", text: "f'(x) = 3x² / x", isCorrect: false },
      { id: "opt-2", label: "B", text: "f'(x) = x² · (3 ln(x) + 1)", isCorrect: true },
      { id: "opt-3", label: "C", text: "f'(x) = 3x² · ln(x)", isCorrect: false },
      { id: "opt-4", label: "D", text: "f'(x) = x³ + 3x²", isCorrect: false },
    ],
    explanation: {
      summary: "Product rule: (u·v)' = u'v + uv'.",
      whyCorrect: "u = x³ ⇒ u' = 3x²; v = ln(x) ⇒ v' = 1/x. Summing gives 3x² ln(x) + x² = x²(3 ln(x) + 1).",
      whyWrong: "Options A and C miss the secondary derivative product term uv'.",
    },
    timeRemainingSec: 18,
  },
  {
    id: "q3",
    subject: "Chemistry",
    topic: "Atomic Structure",
    question: "Which trend correctly describes electronegativity across a period from left to right?",
    options: [
      { id: "opt-1", label: "A", text: "Decreases due to shielding", isCorrect: false },
      { id: "opt-2", label: "B", text: "Remains constant", isCorrect: false },
      { id: "opt-3", label: "C", text: "Increases with nuclear charge", isCorrect: true },
      { id: "opt-4", label: "D", text: "Increases then drops abruptly", isCorrect: false },
    ],
    explanation: {
      summary: "Effective nuclear charge increases across the same electron shell.",
      whyCorrect: "Greater core attraction pulls valence electrons closer, increasing electronegativity.",
      whyWrong: "Shielding remains constant across the same principal quantum level.",
    },
    timeRemainingSec: 22,
  },
];

/**
 * Interactive and animated quiz showcase widget.
 * Simulates real-time test taking, option selection with instant feedback,
 * animated timer countdowns, and step-by-step AI explanation unfolding.
 */
export function QuizInteractiveAnimation({ className, autoPlay = true }: QuizInteractiveAnimationProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25);
  const [scoreStreak, setScoreStreak] = useState(3);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const activeQuestion = SAMPLE_QUESTIONS[currentIdx];

  // Auto-play demo sequence when idle
  useEffect(() => {
    if (!isPlaying) return;

    const countdownInterval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 1 ? prev - 1 : 25));
    }, 1000);

    // Phase 1: Wait 2.8s, then simulate picking correct answer
    const selectTimer = setTimeout(() => {
      const correctOpt = activeQuestion.options.find((o) => o.isCorrect);
      if (correctOpt) {
        setSelectedOptionId(correctOpt.id);
        setShowExplanation(true);
        setScoreStreak((prev) => prev + 1);
      }
    }, 2800);

    // Phase 2: After showing explanation for 4.4s, advance to next question
    const advanceTimer = setTimeout(() => {
      setSelectedOptionId(null);
      setShowExplanation(false);
      setCurrentIdx((prev) => (prev + 1) % SAMPLE_QUESTIONS.length);
      setTimerSeconds(25);
    }, 7200);

    return () => {
      clearTimeout(selectTimer);
      clearTimeout(advanceTimer);
      clearInterval(countdownInterval);
    };
  }, [currentIdx, isPlaying, activeQuestion]);

  // Handle user manual interaction
  const handleSelectOption = (optId: string) => {
    setIsPlaying(false);
    setSelectedOptionId(optId);
    setShowExplanation(true);
    const chosen = activeQuestion.options.find((o) => o.id === optId);
    if (chosen?.isCorrect) {
      setScoreStreak((s) => s + 1);
    }
  };

  const handleNextQuestion = useCallback(() => {
    setSelectedOptionId(null);
    setShowExplanation(false);
    setCurrentIdx((prev) => (prev + 1) % SAMPLE_QUESTIONS.length);
    setTimerSeconds(25);
  }, []);

  const handleReset = () => {
    setSelectedOptionId(null);
    setShowExplanation(false);
    setTimerSeconds(25);
    setIsPlaying(true);
  };

  return (
    <div className={cn("relative w-full max-w-lg mx-auto select-none", className)}>
      {/* Floating Accent Badge 1: Accuracy Streak */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -left-3 sm:-left-6 z-20 hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 border border-success/30 shadow-md backdrop-blur-md text-xs font-semibold text-success"
      >
        <Flame className="h-3.5 w-3.5 text-warning fill-warning" />
        <span>Streak: {scoreStreak} Correct</span>
      </motion.div>

      {/* Floating Accent Badge 2: AI Explainer active */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-4 -right-2 sm:-right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 border border-primary/30 shadow-md backdrop-blur-md text-xs font-semibold text-primary"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>AI Explanations Active</span>
      </motion.div>

      {/* Main Interactive Quiz Card */}
      <div className="relative bg-card/90 border border-border/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col gap-4 transition-all">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header: Subject, Timer & Progress */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {activeQuestion.subject}
            </span>
            <span className="text-muted-foreground font-medium truncate max-w-[150px] sm:max-w-none">
              {activeQuestion.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Animated Timer Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border/70 text-[11px] font-mono font-semibold text-warning">
              <Timer className="h-3.5 w-3.5 text-warning animate-pulse" />
              <span>00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</span>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={isPlaying ? "Pause auto demo" : "Resume auto demo"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Question Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQuestion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-1"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span>Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}</span>
              <span className="text-primary font-bold">100 Points</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug m-0">
              {activeQuestion.question}
            </h4>
          </motion.div>
        </AnimatePresence>

        {/* Options Grid */}
        <div className="flex flex-col gap-2 pt-1">
          {activeQuestion.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isAnswered = selectedOptionId !== null;
            const isCorrectOption = opt.isCorrect;

            let optionStyle = "border-border/70 bg-surface/50 text-foreground hover:border-primary/50 hover:bg-surface";
            if (isAnswered) {
              if (isSelected && isCorrectOption) {
                optionStyle = "border-success bg-success/10 text-success font-semibold shadow-xs";
              } else if (isSelected && !isCorrectOption) {
                optionStyle = "border-danger bg-danger/10 text-danger font-semibold";
              } else if (isCorrectOption) {
                optionStyle = "border-success/60 bg-success/5 text-success font-semibold";
              } else {
                optionStyle = "border-border/40 bg-surface/30 opacity-60 text-muted-foreground";
              }
            }

            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectOption(opt.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer",
                  optionStyle
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-6 w-6 rounded-lg bg-card border border-border/60 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {opt.label}
                  </span>
                  <span className="truncate">{opt.text}</span>
                </div>

                {isAnswered && isCorrectOption && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  </motion.div>
                )}

                {isAnswered && isSelected && !isCorrectOption && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <XCircle className="h-4 w-4 text-danger shrink-0" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* AI Explanation Card — Animated Slide Down */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="p-3.5 rounded-xl bg-primary/8 border border-primary/20 text-xs flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                    <Brain className="h-3.5 w-3.5" />
                    AI Conceptual Explanation:
                  </span>
                  <span className="text-[10px] font-bold text-success bg-success/15 px-2 py-0.2 rounded-full uppercase">
                    +100 XP
                  </span>
                </div>
                <p className="text-foreground/90 text-[11px] leading-relaxed m-0 font-medium">
                  {activeQuestion.explanation.whyCorrect}
                </p>
                <p className="text-muted-foreground text-[10px] leading-relaxed m-0 italic">
                  💡 Tip: {activeQuestion.explanation.whyWrong}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <button
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Demo</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {isPlaying ? "Demo Autoplaying" : "Interactive Mode"}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNextQuestion}
              className="h-7 text-xs font-semibold gap-1 px-3"
            >
              <span>Next</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizInteractiveAnimation;
