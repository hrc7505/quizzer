"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { GState } from "jspdf";
import Link from "next/link";
import {
  Trophy,
  Share2,
  FileDown,
  X,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Sparkles,
  Clock,
  ArrowRight,
  Eye,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { AttemptService, LeaderboardEntry } from "@/lib/services/attempt.service";
import { splitSentences, formatTime } from "@/lib/text";
import { QuizResultsProps, QuestionData, UserAnswerData } from "./interfaces/QuizResults.interface";
import { ShareButton } from "@/components/ui/ShareButton";
import { Alert } from "@/components/ui/Alert";
import { NoData } from "@/components/feedback/NoData";
import { DeepDiveBody } from "./DeepDiveBody";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions } from "@/components/ui/Dialog";
import { Sheet, SheetContent, SheetHeader, SheetBody } from "@/components/ui/Sheet";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

/**
 * Custom Accordion Item for quiz questions in detailed review.
 */
function DetailedQuestionAccordionItem({
  question,
  index,
  answer,
  elaborations,
  activeElaborationId,
  handleElaborate,
  onOpenFullPage,
}: {
  question: QuestionData;
  index: number;
  answer?: UserAnswerData;
  elaborations: Record<string, { loading: boolean; data?: string; error?: string }>;
  activeElaborationId: string | null;
  handleElaborate: (id: string) => void;
  onOpenFullPage: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = answer?.isCorrect;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden mb-3 bg-card transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left gap-3.5 hover:bg-surface-hover transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant={isCorrect ? "success" : "danger"} className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 px-0">
            {index + 1}
          </Badge>
          <span className={cn(
            "text-sm font-semibold text-foreground leading-snug truncate pr-4",
            !isCorrect && "text-danger/90 font-bold"
          )}>
            {question.text}
          </span>
        </div>
        <div className="shrink-0 text-muted-foreground/60">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 bg-secondary/15 border-t border-border/50 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1 bg-success/10 text-success border border-success/10 p-3 rounded-lg font-medium">
            <span className="font-bold text-[10px] uppercase tracking-wider opacity-95">✓ Correct Answer</span>
            <span className="text-foreground font-semibold">{question.correctAnswer}</span>
          </div>

          {!isCorrect && answer && (
            <div className="flex flex-col gap-1 bg-danger/10 text-danger border border-danger/10 p-3 rounded-lg font-medium">
              <span className="font-bold text-[10px] uppercase tracking-wider opacity-95">✗ Your Answer</span>
              <span className="text-foreground font-semibold">{answer.selectedAnswer}</span>
            </div>
          )}

          <div className="flex flex-col gap-1 bg-card border border-border/60 p-3.5 rounded-lg">
            <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Explanation</span>
            <p className="text-foreground/90 leading-relaxed mt-0.5 whitespace-pre-wrap">{question.description}</p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleElaborate(question.id)}
              disabled={elaborations[question.id]?.loading && activeElaborationId === question.id}
              className="gap-1.5 h-8 font-semibold text-xs text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40"
            >
              {elaborations[question.id]?.loading && activeElaborationId === question.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {elaborations[question.id]?.data ? "View Deep Dive" : "Generate Deep Dive"}
              </span>
            </Button>
            
            {elaborations[question.id]?.data && (
              <Link href={onOpenFullPage}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 h-8 font-semibold text-xs text-muted-foreground/80 hover:text-foreground"
                >
                  <span>Open Full Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * QuizResults component renders the results screen after quiz completion,
 * including score overview, option to download a PDF report, and
 * a Detailed Review dialog modal.
 */
export function QuizResults({ attempt }: QuizResultsProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  useSession();

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const ld = await AttemptService.getLeaderboard(attempt.quizId);
        setLeaderboard(ld);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [attempt.quizId]);

  // Pre-seed in-memory cache from DB-persisted elaborations
  const initialElaborations = useMemo(() => {
    const cache: Record<string, { loading: boolean; data?: string; error?: string }> = {};
    attempt.quiz.questions.forEach((q: QuestionData) => {
      if (q.elaboration) {
        cache[q.id] = { loading: false, data: q.elaboration };
      }
    });
    return cache;
  }, [attempt.quiz.questions]);

  const [elaborations, setElaborations] = useState<Record<string, { loading: boolean, data?: string, error?: string }>>(initialElaborations);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeElaborationId, setActiveElaborationId] = useState<string | null>(null);

  const questionObj = useMemo(() => {
    if (!activeElaborationId) return null;
    const q = attempt.quiz.questions.find((qi: QuestionData) => qi.id === activeElaborationId);
    if (!q) return null;
    return {
      ...q,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        difficulty: attempt.quiz.difficulty || "Medium",
      },
      topic: q.topic || { id: "", title: "General" },
    };
  }, [activeElaborationId, attempt.quiz]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const headerHeight = 18;

      const logoRes = await fetch("/quizzer.svg");
      const logoText = await logoRes.text();
      const logoBlob = new Blob([logoText], { type: "image/svg+xml" });
      const logoUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      const svgToPng = (svgUrl: string): Promise<string> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context unavailable"));
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = () => reject(new Error("Failed to load SVG for PDF watermark"));
          img.src = svgUrl;
        });

      const logoPng = await svgToPng(logoUrl);

      const logoAspect = 833 / 280;
      const headerLogoWidth = 24;
      const headerLogoHeight = headerLogoWidth / logoAspect;

      let useWinkySans = false;
      try {
        const fontRes = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/winkysans/WinkySans%5Bwght%5D.ttf");
        if (fontRes.ok) {
          const fontBuffer = await fontRes.arrayBuffer();
          const fontBase64 = btoa(
            Array.from(new Uint8Array(fontBuffer))
              .map((byte) => String.fromCharCode(byte))
              .join("")
          );
          pdf.addFileToVFS("WinkySans.ttf", fontBase64);
          pdf.addFont("WinkySans.ttf", "WinkySans", "normal");
          pdf.addFont("WinkySans.ttf", "WinkySans", "bold");
          useWinkySans = true;
        }
      } catch {
        useWinkySans = false;
      }

      const fontFamily = useWinkySans ? "WinkySans" : "helvetica";

      const drawHeader = () => {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(0, 0, pageWidth, headerHeight, "F");
        pdf.setDrawColor(230, 232, 235);
        pdf.line(0, headerHeight, pageWidth, headerHeight);
        const logoY = (headerHeight - headerLogoHeight) / 2;
        pdf.addImage(logoPng, "PNG", margin, logoY, headerLogoWidth, headerLogoHeight);
        pdf.setFont(fontFamily, "bold");
        pdf.setFontSize(14);
        const titleText = attempt.quiz.title;
        const titleX = margin + headerLogoWidth + 6;
        const titleY = headerHeight - 6;
        pdf.setTextColor(30, 41, 59);
        pdf.text(titleText, titleX, titleY);
        pdf.setTextColor(0, 0, 0);
      };

      const addWatermark = () => {
        const wmWidth = 120;
        const wmHeight = wmWidth / logoAspect;
        const wmX = (pageWidth - wmWidth) / 2;
        const wmY = (pageHeight - wmHeight) / 2;
        pdf.setGState(new GState({ opacity: 0.12 }));
        pdf.addImage(logoPng, "PNG", wmX, wmY, wmWidth, wmHeight);
        pdf.setGState(new GState({ opacity: 1 }));
      };

      drawHeader();
      addWatermark();

      let y = headerHeight + 12;

      pdf.setFontSize(12);
      pdf.setFont(fontFamily, "normal");

      attempt.quiz.questions.forEach((q: QuestionData, i: number) => {
        const qText = `${i + 1}. ${q.text}`;
        const splitText = pdf.splitTextToSize(qText, pageWidth - 2 * margin);
        
        if (y + (splitText.length * 6) > pageHeight - margin) {
          pdf.addPage();
          drawHeader();
          addWatermark();
          y = headerHeight + 12;
        }
        
        pdf.setFont(fontFamily, "bold");
        pdf.setFontSize(12);
        pdf.text(splitText, margin, y);
        y += splitText.length * 6;
        
        pdf.setFont(fontFamily, "normal");
        pdf.setFontSize(12);
        const letters = ["A", "B", "C", "D"];
        q.options.forEach((opt: string, optIndex: number) => {
          const optText = `   ${letters[optIndex]}) ${opt}`;
          const splitOpt = pdf.splitTextToSize(optText, pageWidth - 2 * margin);
          
          if (y + (splitOpt.length * 6) > pageHeight - margin) {
            pdf.addPage();
            drawHeader();
            addWatermark();
            y = headerHeight + 12;
            pdf.setFont(fontFamily, "normal");
            pdf.setFontSize(12);
          }
          
          pdf.text(splitOpt, margin, y);
          y += splitOpt.length * 6;
        });
        
        y += 6; // Space between questions
      });

      // Answer Key
      pdf.addPage();
      drawHeader();
      addWatermark();
      y = headerHeight + 12;
      pdf.setFontSize(16);
      pdf.setFont(fontFamily, "bold");
      pdf.text("Answer Key", margin, y);
      y += 12;

      pdf.setFontSize(12);
      pdf.setFont(fontFamily, "normal");
      
      attempt.quiz.questions.forEach((q: QuestionData, i: number) => {
        const letters = ["A", "B", "C", "D"];
        const correctIndex = q.options.indexOf(q.correctAnswer);
        const correctLetter = correctIndex >= 0 ? letters[correctIndex] : "";
        
        const ansText = `${i + 1}. ${correctLetter} - ${q.correctAnswer}`;
        const splitAns = pdf.splitTextToSize(ansText, pageWidth - 2 * margin);
        
        if (y + (splitAns.length * 6) > pageHeight - margin) {
          pdf.addPage();
          drawHeader();
          addWatermark();
          y = headerHeight + 12;
          pdf.setFont(fontFamily, "normal");
          pdf.setFontSize(12);
        }
        
        pdf.setFont(fontFamily, "bold");
        pdf.setFontSize(12);
        pdf.text(splitAns, margin, y);
        y += splitAns.length * 6;

        if (q.description) {
          const descParts = q.description.split("\n").flatMap((line: string) =>
            splitSentences(line)
          );

          descParts.forEach((part: string) => {
            const bulletText = part.trim();
            const splitBullet = pdf.splitTextToSize(bulletText, pageWidth - 2 * (margin + 8));
            const lineCount = splitBullet.length;
            const lineHeight = 4.5;
            const boxPadding = 3;
            const boxHeight = lineCount * lineHeight + boxPadding * 2;

            if (y + boxHeight > pageHeight - margin) {
              pdf.addPage();
              drawHeader();
              addWatermark();
              y = headerHeight + 12;
              pdf.setFont(fontFamily, "normal");
              pdf.setFontSize(9);
            }

            pdf.setFillColor(240, 249, 255);
            pdf.setGState(new GState({ opacity: 0.6 }));
            pdf.roundedRect(margin + 2, y, pageWidth - 2 * (margin + 2), boxHeight, 2, 2, "F");
            pdf.setGState(new GState({ opacity: 1 }));
            pdf.setFont(fontFamily, "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            
            const circleX = margin + 7;
            const circleY = y + boxPadding + 1;
            pdf.setFillColor(16, 185, 129);
            pdf.circle(circleX, circleY, 1, "F");
            pdf.text(splitBullet, margin + 11, y + boxPadding + 2.5);
            
            pdf.setTextColor(0, 0, 0);
            y += boxHeight;
          });

          y += 4;
        }

        y += 4;
      });

      pdf.save(`quiz-${attempt.quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
      setError("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleElaborate = async (questionId: string) => {
    setActiveElaborationId(questionId);
    setIsDrawerOpen(true);
    if (elaborations[questionId]?.data || elaborations[questionId]?.loading) return;
    
    setElaborations(prev => ({ ...prev, [questionId]: { loading: true } }));
    try {
      const res = await fetch("/api/admin/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId })
      });
      const json = await res.json();
      if (json.success) {
        setElaborations(prev => ({ ...prev, [questionId]: { loading: false, data: json.markdown } }));
      } else {
        setElaborations(prev => ({ ...prev, [questionId]: { loading: false, error: json.error } }));
      }
    } catch {
      setElaborations(prev => ({ ...prev, [questionId]: { loading: false, error: "Failed to load" } }));
    }
  };

  const scoreIndicatorClass = 
    attempt.scorePercentage >= 80 
      ? "bg-success" 
      : attempt.scorePercentage >= 50 
        ? "bg-warning" 
        : "bg-danger";

  const scoreTextClass = 
    attempt.scorePercentage >= 80 
      ? "text-success" 
      : attempt.scorePercentage >= 50 
        ? "text-warning" 
        : "text-danger";

  const handleShareUrl = async () => {
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
  };

  const handleMobileShare = async () => {
    const shareUrl = await handleShareUrl();
    const text = `${attempt.quiz.title} — I scored ${Math.round(attempt.scorePercentage)}% on Quizzer!`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: text, text, url: shareUrl });
      }
    } catch {
      // user cancelled or unsupported
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full py-2">
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
          Quiz Results
        </h1>

        <div className="flex items-center gap-2">
          {/* Desktop share button */}
          <div className="hidden sm:block">
            <ShareButton
              icon={<Share2 className="h-4 w-4" />}
              buttonAppearance="outline"
              buttonSize="icon"
              buttonClassName="h-9 w-9 border border-border/80 bg-surface rounded-lg"
              shareText={`${attempt.quiz.title} — I scored ${Math.round(attempt.scorePercentage)}% on Quizzer!`}
              defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${attempt.quizId}`}
              resolveUrl={handleShareUrl}
            />
          </div>

          {/* Overflow dropdown (desktop + mobile) */}
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
              {/* Mobile-only share inside overflow */}
              <DropdownItem onClick={handleMobileShare} className="sm:hidden">
                <span className="flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </span>
              </DropdownItem>
              <DropdownItem onClick={() => setIsReviewOpen(true)}>
                <span className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  Detailed Review
                </span>
              </DropdownItem>
              <DropdownItem onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                <span>Download PDF</span>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      <div ref={resultRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Score Overview Card */}
        <Card className="p-6 border-border/80 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quiz Title</span>
            <span className="text-base font-bold text-foreground leading-snug">{attempt.quiz.title}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center py-6 border border-border/40 rounded-2xl bg-secondary/5">
            <span className={cn("text-5xl font-extrabold tracking-tight", scoreTextClass)}>
              {Math.round(attempt.scorePercentage)}%
            </span>
            <span className="text-xs font-semibold text-muted-foreground/80 mt-1 uppercase tracking-wider">Final Score</span>
          </div>
          
          <div className="w-full">
            <Progress value={attempt.scorePercentage} indicatorClassName={scoreIndicatorClass} />
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/30 pt-4 mt-1 text-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Correct</span>
              <span className="text-base font-bold text-success">{attempt.correctCount}</span>
            </div>
            <div className="flex flex-col gap-0.5 border-l border-r border-border/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Incorrect</span>
              <span className="text-base font-bold text-danger">{attempt.wrongCount}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Time Taken</span>
              <span className="text-base font-bold text-foreground">{Math.floor(attempt.timeTakenSec / 60)}m {attempt.timeTakenSec % 60}s</span>
            </div>
          </div>
        </Card>

        {/* Leaderboard Card */}
        <Card className="p-6 border-border/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Trophy className="h-5 w-5 text-warning shrink-0" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">Quiz Leaderboard - Top 10</h2>
          </div>

          {loadingLeaderboard ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading leaderboard...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <NoData title="No rankings available yet." description="Be the first to top the leaderboard!" icon="sparkle" compact />
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
                  {leaderboard.map((rank, index) => {
                    let badgeClass = "bg-secondary text-secondary-foreground";
                    if (index === 0) badgeClass = "bg-amber-500 text-white font-black shadow-xs shadow-amber-500/25";
                    else if (index === 1) badgeClass = "bg-slate-400 text-white font-black shadow-xs shadow-slate-400/25";
                    else if (index === 2) badgeClass = "bg-amber-700 text-white font-black shadow-xs shadow-amber-700/25";

                    return (
                      <tr key={rank.userId} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
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
                            {rank.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={rank.image} alt={rank.name} className="h-5 w-5 rounded-full object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {rank.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className={cn("truncate font-medium text-foreground", index < 3 && "font-semibold")}>
                              {rank.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "font-bold",
                            (rank.scorePercentage ?? 0) >= 80 
                              ? "text-success" 
                              : (rank.scorePercentage ?? 0) >= 50 
                                ? "text-warning" 
                                : "text-danger"
                          )}>
                            {Math.round(rank.scorePercentage ?? 0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground/80 font-medium">
                          {formatTime(rank.timeTakenSec ?? 0)}
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

      {/* Detailed Review Modal Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogSurface className="max-w-[720px] p-6">
          <DialogTitle>Detailed Review</DialogTitle>
          <DialogContent className="max-h-[60vh] overflow-y-auto pr-1 mt-4">
            <div className="flex flex-col">
              {attempt.quiz.questions.map((question: QuestionData, index: number) => {
                const answer = attempt.answers.find((a: UserAnswerData) => a.questionId === question.id);
                return (
                  <DetailedQuestionAccordionItem
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
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Close Review
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* AI Deep Dive Overlay Drawer Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="max-w-2xl">
          <SheetHeader>AI Deep Dive</SheetHeader>
          <SheetBody>
            {activeElaborationId && (
              <div className="flex flex-col h-full">
                {elaborations[activeElaborationId]?.loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>AI is formulating detailed concept breakdown…</span>
                  </div>
                )}
                
                {elaborations[activeElaborationId]?.error && (
                  <Alert variant="danger" title="Error">
                    {elaborations[activeElaborationId].error}
                  </Alert>
                )}
                
                {elaborations[activeElaborationId]?.data && questionObj && (
                  <DeepDiveBody question={{
                    ...questionObj,
                    elaboration: elaborations[activeElaborationId].data as string
                  }} />
                )}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
export default QuizResults;
