"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Card, Text, Button, ProgressBar, Badge, Spinner, MessageBar, MessageBarBody,
  TeachingPopover, TeachingPopoverTrigger, TeachingPopoverSurface, 
  TeachingPopoverHeader, TeachingPopoverTitle, TeachingPopoverBody,
  Avatar,
  DataGrid, DataGridHeader, DataGridRow, DataGridHeaderCell,
  DataGridBody, DataGridCell, TableCellLayout, TableColumnDefinition,
  createTableColumn,
} from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { 
  Play24Filled, ArrowClockwise24Regular, Sparkle24Regular,
  Trophy24Regular, Timer24Regular, BookOpen24Regular, Lightbulb24Regular,
  Checkmark24Regular
} from "@fluentui/react-icons";

import { AttemptService } from "@/lib/services/attempt.service";
import { splitSentences, formatTime } from "@/lib/text";
import { useQuizWizardStyles } from "./styles/useQuizWizardStyles";
import { ShareButton } from "./ShareButton";
import { Share24Regular } from "@fluentui/react-icons";
import NoData from "./NoData";

/**
 * QuizWizard Component. Coordinates quiz play state, fetches leaderboards, 
 * manages save/resume attempts, and saves user answers in real-time.
 * 
 * @param props.quiz - The quiz details containing questions.
 */
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

// Use backend leaderboard entry type directly for strict compatibility.
interface QuizWizardAttempt {
  attemptId: string;
  quizId: string;
  answers: QuizWizardAnswer[];
  timeTakenSec: number;
}

export function QuizWizard({ quiz }: { quiz: QuizWizardQuiz }) {
  type AttemptLeaderboardEntry = import("@/lib/services/attempt.service").LeaderboardEntry;


  const styles = useQuizWizardStyles();
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

  /**
   * Starts or resumes the quiz.
   * @param forceNew - If true, deletes any existing attempt and starts fresh.
   * @param resumeAttemptId - If provided, skips the API call and uses this attempt directly.
   */
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
      // If we already have the attempt data from the initial load, use it directly
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
          // Resuming an attempt: populate answers and restore state
          const formattedAnswers: QuizWizardAnswer[] = data.answers.map((ans: QuizWizardAnswer) => ({
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect
          }));

          setAnswers(formattedAnswers);
          setTimeTaken(data.timeTakenSec);
          setCurrentIndex(formattedAnswers.length);
        } else {
          // Starting fresh
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
    if (selectedOption) return; // Prevent changing answer once selected
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
      // Finalize Quiz Attempt after the last answer is saved.
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




  /** DataGrid column definitions for the leaderboard */
  const leaderboardColumns = useMemo<TableColumnDefinition<AttemptLeaderboardEntry>[]>(() => [
    createTableColumn<AttemptLeaderboardEntry>({
      columnId: "rank",
      renderHeaderCell: () => "Rank",
      renderCell: (item) => {
        const badgeStyle: Record<number, string> = {
          1: "#f59e0b",
          2: "#94a3b8",
          3: "#cd7f32",
        };
        const bg = badgeStyle[item.rank ?? 0] || "#e2e8f0";
        return (
          <TableCellLayout>
            <span className={`${styles.rankBadge} ${styles.rankSpan}`} style={{ backgroundColor: bg, color: (item.rank ?? 0) <= 3 ? "#fff" : "#475569" }}>
              {item.rank}
            </span>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<AttemptLeaderboardEntry>({
      columnId: "player",
      renderHeaderCell: () => "Player",
      renderCell: (item) => (
        <TableCellLayout
          media={<Avatar size={24} name={item.name} image={{ src: item.image || undefined }} />}
        >
          <Text weight={(item.rank ?? 0) <= 3 ? "semibold" : "regular"}>{item.name}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<AttemptLeaderboardEntry>({
      columnId: "score",
      renderHeaderCell: () => "Score",
      renderCell: (item) => (
        <TableCellLayout>
          <Text className={styles.scoreText} style={{ color: (item.scorePercentage ?? 0) >= 80 ? "#10b981" : (item.scorePercentage ?? 0) >= 50 ? "#f59e0b" : "#ef4444" }}>
            {Math.round(item.scorePercentage ?? 0)}%
          </Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<AttemptLeaderboardEntry>({
      columnId: "time",
      renderHeaderCell: () => "Time",
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{formatTime(item.timeTakenSec ?? 0)}</Text>
        </TableCellLayout>
      ),
    }),
  ], [styles]);

  // Rendering Loading Screen
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading quiz..." size="large" />
      </div>
    );
  }

  // Rendering Start/Leaderboard Screen
  if (!isPlaying) {
    return (
      <div className={styles.container}>
        <Card className={styles.startCard}>
          <div className={styles.startIconContainer}>
            <BookOpen24Regular className={styles.iconPrimary} />
          </div>
          <Text size={700} weight="bold" className={styles.startTitle}>
            {quiz.title}
          </Text>
          <Text size={300} className={styles.startSubtitle}>
            Difficulty: <strong>{quiz.difficulty}</strong> • Total Questions: <strong>{questions.length}</strong>
          </Text>

          {authWarning && (
          <div className={styles.authWarningBox}>
            <Text size={300} weight="semibold">{authWarning}</Text>
          </div>
        )}
        <div className={styles.startButtonsRow}>
            {activeAttempt ? (
              <>
                <Button 
                  appearance="primary" 
                  size="large" 
                  icon={<Play24Filled />} 
                  onClick={() => handleStart(false, activeAttempt.attemptId)}
                  className={styles.btnResume}
                >
                  Resume Quiz (Question {activeAttempt.answers.length + 1})
                </Button>
                <Button 
                  appearance="outline" 
                  size="large" 
                  icon={<ArrowClockwise24Regular className={styles.iconMedium} />} 
                  onClick={() => handleStart(true)}
                  className={styles.btnStartFresh}
                >
                  Start Fresh
                </Button>
              </>
            ) : (
              <div className={styles.splitButton}>
                <Button
                  appearance="primary"
                  size="large"
                  icon={<Play24Filled />}
                  onClick={() => handleStart(false)}
                  className={styles.splitPrimary}
                >
                  Start Quiz
                </Button>
                <ShareButton
                  icon={<Share24Regular />}
                  buttonAppearance="outline"
                  buttonSize="large"
                  shareText={`Check out this quiz: ${quiz.title} on Quizzer!`}
                  defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${quiz.id}`}
                  resolveUrl={resolveShareUrl}
                  buttonClassName={styles.splitChevron}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Leaderboard Section */}
        <Card className={styles.leaderboardCard}>
          <div className={styles.leaderboardTitleRow}>
            <Trophy24Regular className={styles.iconGold} />
            <Text size={500} weight="bold">Top 10 Rankings</Text>
          </div>

          {leaderboard.length === 0 ? (
            <NoData
              title="No rankings available yet."
              description="Be the first to top the leaderboard!"
              icon="sparkle"
            />
          ) : (
            <DataGrid
              items={leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }))}

              columns={leaderboardColumns}
              getRowId={(item) => item.userId}
              focusMode="none"
              aria-label="Leaderboard"
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody>
                {({ item, rowId }) => (
                  <DataGridRow key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
        </Card>
      </div>
    );
  }

  // Gameplay Progress Bar
  const progress = currentIndex / questions.length;

  // Render Quiz Playing Wizard
  return (
    <div className={styles.container}>
      {/* Quiz Top Header */}
      <div className={styles.header}>
        <Text size={600} weight="bold">{quiz.title}</Text>
        <Badge appearance="filled" color="brand" className={styles.badgeTimer}>
          <Timer24Regular className={styles.iconSmall} />
          {formatTime(timeTaken)}
        </Badge>
      </div>

      {/* Progress tracking */}
      <div className={styles.progressContainer}>
        <div className={styles.progressInfo}>
          <Text size={200}>Question {currentIndex + 1} of {questions.length}</Text>
          <Text size={200}>{Math.round(progress * 100)}% Complete</Text>
        </div>
        <ProgressBar value={progress} max={1} />
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <Card className={styles.questionCard}>
          <div className={styles.questionTextRow}>
            <Text size={400} weight="semibold" className={styles.questionPlayText}>
              {currentQuestion.text}
            </Text>
          </div>

          {/* Answer Options */}
          <div className={styles.optionsGrid} role="group" aria-label="Answer options">
            {currentQuestion.options.map((opt: string, i: number) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = currentQuestion.correctAnswer === opt;
              
              let optionStateClass = styles.optionDefault;

              if (selectedOption) {
                if (isCorrectAnswer) {
                  optionStateClass = styles.optionCorrect;
                } else if (isSelected && !isCorrectAnswer) {
                  optionStateClass = styles.optionIncorrect;
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOptionClick(opt);
                    }
                  }}
                  className={`${styles.optionItem} ${optionStateClass}`}
                  aria-pressed={isSelected}
                  aria-label={`Option ${i + 1}: ${opt}${isSelected ? ", selected" : ""}${isCorrectAnswer && selectedOption ? ", correct answer" : ""}`}
                  disabled={!!selectedOption}
                >
                  <Text size={200} weight={selectedOption && isCorrectAnswer ? "bold" : "regular"} className={`${styles.quizPlayFont} ${styles.optionText}`}>
                    {opt}
                  </Text>
                </button>
              );
            })}
          </div>

          {/* Explanation Box shown post answering */}
          {selectedOption && currentQuestion.description && (
            <div className={styles.explanationBox}>
              <div className={styles.explanationHeaderRow}>
                <Sparkle24Regular className={styles.explanationIcon} />
                <Text weight="bold" className={styles.explanationTitle}>Answer Explanation:</Text>
              </div>
              <div className={styles.explanationText}>
                {currentQuestion.description.split("\n").flatMap((line: string) =>
                  splitSentences(line).map((part: string, idx: number) => (
                    <div key={idx} className={styles.explanationRow}>
                      <Checkmark24Regular className={styles.explanationCheck} />
                      <Text size={300} className={styles.quizPlayFont}>{part}</Text>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className={styles.actionsRow}>
            {currentQuestion.hint ? (
              <TeachingPopover open={showHint} onOpenChange={(e, data) => setShowHint(data.open)}>
                <TeachingPopoverTrigger>
                  <Button
                    appearance="subtle"
                    icon={<Lightbulb24Regular />}
                    aria-label="Hint"
                    size="large"
                  />
                </TeachingPopoverTrigger>
                <TeachingPopoverSurface>
                  <TeachingPopoverHeader>
                    <TeachingPopoverTitle>Hint</TeachingPopoverTitle>
                  </TeachingPopoverHeader>
                  <TeachingPopoverBody>
                    <div className={styles.quizPlayFont}>{currentQuestion.hint}</div>
                  </TeachingPopoverBody>
                </TeachingPopoverSurface>
              </TeachingPopover>
            ) : (
              <span />
            )}

            <Button 
              appearance="primary" 
              size="large" 
              disabled={!selectedOption || isSubmitting} 
              onClick={handleNext}
              className={styles.btnNext}
            >
              {isSubmitting ? (
                <Spinner size="tiny" />
              ) : (
                currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
