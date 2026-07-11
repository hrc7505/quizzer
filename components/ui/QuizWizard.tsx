"use client";

import { useState, useEffect } from "react";
import { 
  Card, CardHeader, Text, Button, ProgressBar, Badge, Spinner, 
  TeachingPopover, TeachingPopoverTrigger, TeachingPopoverSurface, 
  TeachingPopoverHeader, TeachingPopoverTitle, TeachingPopoverBody,
  Avatar,
  DataGrid, DataGridHeader, DataGridRow, DataGridHeaderCell,
  DataGridBody, DataGridCell, TableCellLayout, TableColumnDefinition,
  createTableColumn,
} from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { 
  Play24Filled, ArrowClockwise24Regular, Sparkle24Regular, 
  Trophy24Regular, Timer24Regular, BookOpen24Regular
} from "@fluentui/react-icons";
import { AttemptService } from "@/lib/services/attempt.service";
import { useQuizWizardStyles } from "./styles/useQuizWizardStyles";

/**
 * QuizWizard Component. Coordinates quiz play state, fetches leaderboards, 
 * manages save/resume attempts, and saves user answers in real-time.
 * 
 * @param props.quiz - The quiz details containing questions.
 */
export function QuizWizard({ quiz }: { quiz: any }) {
  const styles = useQuizWizardStyles();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [attemptId, setAttemptId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Gameplay State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  // 1. Initial Load: Check for in-progress attempts and retrieve quiz leaderboard
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch active attempt (without forcing new)
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, createOnNotFound: false }),
        });
        const attemptData = await res.json();
        
        if (attemptData.success && attemptData.attemptId && attemptData.answers && attemptData.answers.length > 0) {
          setActiveAttempt(attemptData);
          console.log("[QuizWizard] Found in-progress attempt:", attemptData.attemptId, "answers:", attemptData.answers.length);
        } else {
          console.log("[QuizWizard] No in-progress attempt found. attemptId:", attemptData.attemptId, "answers:", attemptData.answers?.length);
        }

        // Fetch leaderboard
        const leaderboardData = await AttemptService.getLeaderboard(quiz.id);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Failed to initialize quiz metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [quiz.id]);

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
    setLoading(true);
    try {
      // If we already have the attempt data from the initial load, use it directly
      if (!forceNew && resumeAttemptId && activeAttempt) {
        setAttemptId(resumeAttemptId);
        const formattedAnswers = activeAttempt.answers.map((ans: any) => ({
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
          const formattedAnswers = data.answers.map((ans: any) => ({
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
        alert("Failed to initialize quiz attempt.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer once selected
    setSelectedOption(option);
  };

  const handleNext = async () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const currentAnswerObj = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect
    };
    
    const newAnswers = [...answers, currentAnswerObj];
    setAnswers(newAnswers);

    // Save answer dynamically to the server database
    try {
      await AttemptService.saveAnswer(
        attemptId, 
        currentQuestion.id, 
        selectedOption, 
        isCorrect, 
        timeTaken
      );
    } catch (error) {
      console.error("Failed to save answer progress:", error);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      // Finalize Quiz Attempt
      setIsSubmitting(true);
      try {
        const res = await AttemptService.completeAttempt(attemptId, timeTaken);
        if (res.success) {
          router.push(`/quiz/results/${res.attemptId}`);
        } else {
          alert("Failed to submit attempt");
        }
      } catch (err) {
        alert("An error occurred while finalizing quiz.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /** DataGrid column definitions for the leaderboard */
  const leaderboardColumns: TableColumnDefinition<any>[] = [
    createTableColumn<any>({
      columnId: "rank",
      renderHeaderCell: () => "Rank",
      renderCell: (item) => {
        const badgeStyle: Record<number, string> = {
          1: "#f59e0b", // gold
          2: "#94a3b8", // silver
          3: "#cd7f32", // bronze
        };
        const bg = badgeStyle[item.rank] || "#e2e8f0";
        return (
          <TableCellLayout>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: "50%",
              backgroundColor: bg, color: item.rank <= 3 ? "#fff" : "#475569",
              fontWeight: 700, fontSize: 13,
            }}>
              {item.rank}
            </span>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<any>({
      columnId: "player",
      renderHeaderCell: () => "Player",
      renderCell: (item) => (
        <TableCellLayout
          media={<Avatar size={24} name={item.name} image={{ src: item.image || undefined }} />}
        >
          <Text weight={item.rank <= 3 ? "semibold" : "regular"}>{item.name}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<any>({
      columnId: "score",
      renderHeaderCell: () => "Score",
      renderCell: (item) => (
        <TableCellLayout>
          <Text style={{ color: item.scorePercentage >= 80 ? "#10b981" : item.scorePercentage >= 50 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
            {Math.round(item.scorePercentage)}%
          </Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<any>({
      columnId: "time",
      renderHeaderCell: () => "Time",
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{formatTime(item.timeTakenSec)}</Text>
        </TableCellLayout>
      ),
    }),
  ];

  // Rendering Loading Screen
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
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
            <BookOpen24Regular style={{ color: "#4f46e5", fontSize: "32px" }} />
          </div>
          <Text size={700} weight="bold" className={styles.startTitle}>
            {quiz.title}
          </Text>
          <Text size={300} className={styles.startSubtitle}>
            Difficulty: <strong>{quiz.difficulty}</strong> • Total Questions: <strong>{questions.length}</strong>
          </Text>

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
                  icon={<ArrowClockwiseRegularWrapper />} 
                  onClick={() => handleStart(true)}
                  className={styles.btnStartFresh}
                >
                  Start Fresh
                </Button>
              </>
            ) : (
              <Button 
                appearance="primary" 
                size="large" 
                icon={<Play24Filled />} 
                onClick={() => handleStart(false)}
                className={styles.btnStart}
              >
                Start Quiz
              </Button>
            )}
          </div>
        </Card>

        {/* Leaderboard Section */}
        <Card className={styles.leaderboardCard}>
          <div className={styles.leaderboardTitleRow}>
            <Trophy24Regular style={{ color: '#f59e0b' }} />
            <Text size={500} weight="bold">Top 10 Rankings</Text>
          </div>

          {leaderboard.length === 0 ? (
            <Text size={300} className={styles.leaderboardEmptyText}>
              No rankings available yet. Be the first to top the leaderboard!
            </Text>
          ) : (
            <DataGrid
              items={leaderboard.map((entry: any, index: number) => ({ ...entry, rank: index + 1 }))}
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
        <Badge appearance="filled" color="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
          <Timer24Regular style={{ fontSize: '14px' }} />
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

      {/* Question Card */}
      {currentQuestion && (
        <Card className={styles.questionCard}>
          <div className={styles.questionTextRow}>
            <Text size={500} weight="semibold" style={{ flex: 1, lineHeight: '1.4' }}>
              {currentQuestion.text}
            </Text>
            {currentQuestion.hint && (
              <TeachingPopover open={showHint} onOpenChange={(e, data) => setShowHint(data.open)}>
                <TeachingPopoverTrigger>
                  <Button appearance="subtle">💡 Hint</Button>
                </TeachingPopoverTrigger>
                <TeachingPopoverSurface>
                  <TeachingPopoverHeader>
                    <TeachingPopoverTitle>Hint</TeachingPopoverTitle>
                  </TeachingPopoverHeader>
                  <TeachingPopoverBody>
                    {currentQuestion.hint}
                  </TeachingPopoverBody>
                </TeachingPopoverSurface>
              </TeachingPopover>
            )}
          </div>

          {/* Answer Options */}
          <div className={styles.optionsGrid}>
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
                <div 
                  key={i} 
                  onClick={() => handleOptionClick(opt)}
                  className={`${styles.optionItem} ${optionStateClass}`}
                >
                  <Text size={300} weight={selectedOption && isCorrectAnswer ? "bold" : "regular"}>
                    {opt}
                  </Text>
                </div>
              );
            })}
          </div>

          {/* Explanation Box shown post answering */}
          {selectedOption && (
            <div className={styles.explanationBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkle24Regular style={{ color: '#2563eb', fontSize: '18px' }} />
                <Text weight="bold" style={{ color: '#1e3a8a' }}>Answer Explanation:</Text>
              </div>
              <Text size={300} style={{ color: '#1e40af', lineHeight: '1.5' }}>
                {currentQuestion.description}
              </Text>
            </div>
          )}

          {/* Navigation Controls */}
          <div className={styles.actionsRow}>
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

/**
 * Arrow icon wrapper helper component.
 */
function ArrowClockwiseRegularWrapper() {
  return <ArrowClockwise24Regular style={{ fontSize: '16px' }} />;
}
