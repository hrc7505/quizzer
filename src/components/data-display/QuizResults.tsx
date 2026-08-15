"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Share2, FileDown, MoreHorizontal, Eye, Loader2 } from "lucide-react";

import { AttemptService, LeaderboardEntry } from "@/lib/services/attempt.service";
import { generateQuizPDF } from "@/lib/pdf-generator";
import { getAiErrorMeta } from "@/lib/gemini";
import { QuizResultsProps, QuestionData, UserAnswerData } from "@/components/data-display/interfaces/QuizResults.interface";
import { ShareButton } from "@/components/ui/ShareButton";
import { Alert } from "@/components/ui/Alert";
import { ModelCapabilityError } from "@/components/ui/ModelCapabilityError";
import { Button } from "@/components/ui/Button";
import { usePanel, useDialog } from "@/components/providers/OverlayProvider";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { QuizScoreCard } from "@/components/data-display/QuizScoreCard";
import { QuizLeaderboard } from "@/components/data-display/QuizLeaderboard";
import { DetailedQuestionAccordion } from "@/components/data-display/DetailedQuestionAccordion";
import { DeepDivePanel } from "@/components/data-display/DeepDivePanel";

/**
 * QuizResults component renders the results screen after quiz completion,
 * including score overview, leaderboard, and detailed review.
 */
export function QuizResults({ attempt }: QuizResultsProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  useSession();

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchLeaderboard = async () => {
      try {
        const ld = await AttemptService.getLeaderboard(attempt.quizId);
        if (!cancelled) setLeaderboard(ld);
      } catch (err) {
        if (!cancelled) console.error("Failed to load leaderboard:", err);
      } finally {
        if (!cancelled) setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [attempt.quizId]);

  // Pre-seed in-memory cache from DB-persisted elaborations
  const initialElaborations = React.useMemo(() => {
    const cache: Record<string, { loading: boolean; data?: string; error?: string }> = {};
    attempt.quiz.questions.forEach((q: QuestionData) => {
      if (q.elaboration) {
        cache[q.id] = { loading: false, data: q.elaboration };
      }
    });
    return cache;
  }, [attempt.quiz.questions]);

  const [elaborations, setElaborations] = useState<
    Record<string, { loading: boolean; data?: string; error?: string }>
  >(initialElaborations);
  const [activeElaborationId, setActiveElaborationId] = useState<string | null>(null);

  const panel = usePanel();
  const dialog = useDialog();

  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      await generateQuizPDF({
        title: attempt.quiz.title,
        questions: attempt.quiz.questions.map((q: QuestionData) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          description: q.description,
        })),
      });
    } catch (e) {
      console.error("PDF generation failed", e);
      setError("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }, [attempt.quiz.title, attempt.quiz.questions]);

  const handleElaborate = useCallback(
    (questionId: string) => {
      setActiveElaborationId(questionId);
      const question =
        attempt.quiz.questions.find((qi: QuestionData) => qi.id === questionId) ?? null;
      const cached = elaborations[questionId];
      panel.open({
        title: "AI Deep Dive",
        width: "max-w-2xl",
        body: (
          <DeepDivePanel
            question={question}
            quiz={attempt.quiz}
            initialElaboration={cached?.data}
            initialError={cached?.error}
            onSave={(result) => {
              setElaborations((prev) => ({ ...prev, [questionId]: result }));
            }}
          />
        ),
      });
    },
    [attempt.quiz, elaborations, panel, setElaborations]
  );

  const handleShareUrl = useCallback(async () => {
    const origin = window.location.origin;
    let shareUrl = `${origin}/quiz/${attempt.quizId}`;

    try {
      const res = await fetch(`/api/results/${attempt.id}/share-url`);
      if (res.ok) {
        const json = await res.json();
        if (json?.url) shareUrl = `${origin}${json.url}`;
      }
    } catch {
      // keep fallback
    }

    return shareUrl;
  }, [attempt.quizId, attempt.id]);

  return (
    <div className="flex flex-col gap-6 w-full py-2">
      {error && (() => {
        const meta = getAiErrorMeta(error);
        if (meta.icon === "image-off") {
          return <ModelCapabilityError message={error} />;
        }
        return (
          <Alert variant={meta.variant} title="Error">
            {error}
          </Alert>
        );
      })()}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">Quiz Results</h1>

        <div className="flex items-center gap-2">
          <ShareButton
            icon={<Share2 className="h-4 w-4" />}
            buttonAppearance="outline"
            buttonSize="icon"
            buttonClassName="h-9 w-9 border border-border/80 bg-surface rounded-lg"
            shareText={`${attempt.quiz.title} — I scored ${Math.round(attempt.scorePercentage)}% on Quizzer!`}
            defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${attempt.quizId}`}
            resolveUrl={handleShareUrl}
          />

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border border-border/80 bg-surface"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-44">
              <DropdownItem
                onClick={() =>
                  dialog.open({
                    title: "Detailed Review",
                    className: "max-w-3xl",
                    body: (
                      <DetailedReviewBody
                        questions={attempt.quiz.questions}
                        answers={attempt.answers}
                        elaborations={elaborations}
                        activeElaborationId={activeElaborationId}
                        handleElaborate={handleElaborate}
                      />
                    ),
                  })
                }
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  Detailed Review
                </span>
              </DropdownItem>
              <DropdownItem onClick={handleDownloadPDF} disabled={downloading}>
                <span className="flex items-center gap-2">
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  <span>Download PDF</span>
                </span>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      <div ref={resultRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Score Overview Card */}
        <QuizScoreCard
          title={attempt.quiz.title}
          scorePercentage={attempt.scorePercentage}
          correctCount={attempt.correctCount}
          wrongCount={attempt.wrongCount}
          timeTakenSec={attempt.timeTakenSec}
        />

        {/* Leaderboard Card */}
        <QuizLeaderboard
          leaderboard={leaderboard}
          loading={loadingLeaderboard}
          title="Quiz Leaderboard - Top 10"
        />
      </div>
    </div>
  );
}

interface DetailedReviewBodyProps {
  questions: QuestionData[];
  answers: UserAnswerData[];
  elaborations: Record<string, { loading: boolean; data?: string; error?: string }>;
  activeElaborationId: string | null;
  handleElaborate: (questionId: string) => void;
}

function DetailedReviewBody({
  questions,
  answers,
  elaborations,
  activeElaborationId,
  handleElaborate,
}: DetailedReviewBodyProps) {
  return (
    <div className="flex flex-col max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col gap-3">
        {questions.map((question: QuestionData, index: number) => {
          const answer = answers.find((a: UserAnswerData) => a.questionId === question.id);
          return (
            <DetailedQuestionAccordion
              key={question.id}
              question={question}
              index={index}
              answer={answer}
              elaborations={elaborations}
              activeElaborationId={activeElaborationId}
              handleElaborate={handleElaborate}
              onOpenFullPage={`/deep-dives/${question.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default QuizResults;