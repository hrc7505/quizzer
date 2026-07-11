"use client";

import {
  Card,
  Text,
  Button,
  ProgressBar,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Spinner,
  MessageBar,
  MessageBarBody,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
} from "@fluentui/react-components";
import { Dismiss20Regular } from "@fluentui/react-icons";
import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { QuizResultsProps } from "./interfaces/QuizResults.interface";
import { useQuizResultsStyles } from "./styles/useQuizResultsStyles";

/**
 * QuizResults component renders the results screen after quiz completion,
 * including score overview, option to download a PDF report, and
 * a Detailed Review dialog modal.
 */
export function QuizResults({ attempt }: QuizResultsProps) {
  const styles = useQuizResultsStyles();
  const resultRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Pre-seed in-memory cache from DB-persisted elaborations
  const initialElaborations: Record<string, { loading: boolean; data?: string; error?: string }> = {};
  attempt.quiz.questions.forEach((q: any) => {
    if (q.elaboration) {
      initialElaborations[q.id] = { loading: false, data: q.elaboration };
    }
  });

  const [elaborations, setElaborations] = useState<Record<string, { loading: boolean, data?: string, error?: string }>>(initialElaborations);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeElaborationId, setActiveElaborationId] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${attempt.quiz.title}`, margin, y);
      y += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      attempt.quiz.questions.forEach((q: any, i: number) => {
        const qText = `${i + 1}. ${q.text}`;
        const splitText = pdf.splitTextToSize(qText, pageWidth - 2 * margin);
        
        if (y + (splitText.length * 6) > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        pdf.setFont("helvetica", "bold");
        pdf.text(splitText, margin, y);
        y += splitText.length * 6;
        
        pdf.setFont("helvetica", "normal");
        const letters = ["A", "B", "C", "D"];
        q.options.forEach((opt: string, optIndex: number) => {
          const optText = `   ${letters[optIndex]}) ${opt}`;
          const splitOpt = pdf.splitTextToSize(optText, pageWidth - 2 * margin);
          
          if (y + (splitOpt.length * 6) > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          
          pdf.text(splitOpt, margin, y);
          y += splitOpt.length * 6;
        });
        
        y += 6; // Space between questions
      });

      // Answer Key
      pdf.addPage();
      y = margin;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Answer Key", margin, y);
      y += 12;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      
      attempt.quiz.questions.forEach((q: any, i: number) => {
        const letters = ["A", "B", "C", "D"];
        const correctIndex = q.options.indexOf(q.correctAnswer);
        const correctLetter = correctIndex >= 0 ? letters[correctIndex] : "";
        
        const ansText = `${i + 1}. ${correctLetter} - ${q.correctAnswer}`;
        const splitAns = pdf.splitTextToSize(ansText, pageWidth - 2 * margin);
        
        if (y + (splitAns.length * 6) > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        pdf.text(splitAns, margin, y);
        y += splitAns.length * 6;
      });

      pdf.save(`quiz-${attempt.quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Failed to generate PDF");
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
    } catch (e) {
      setElaborations(prev => ({ ...prev, [questionId]: { loading: false, error: "Failed to load" } }));
    }
  };

  const scoreColor = attempt.scorePercentage >= 80 ? "success" : attempt.scorePercentage >= 50 ? "warning" : "error";
  const progressColor = attempt.scorePercentage >= 80 ? "green" : attempt.scorePercentage >= 50 ? "orange" : "red";

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <Text size={700} weight="bold">Quiz Results</Text>
        <div className={styles.buttonGroup}>
          <Button appearance="secondary" onClick={() => setIsReviewOpen(true)}>
            Detailed Review
          </Button>
          <Button appearance="secondary" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Spinner size="tiny" /> : "Download PDF"}
          </Button>
          <Link href="/" className={styles.link}>
            <Button appearance="primary">Return Home</Button>
          </Link>
        </div>
      </div>

      <div ref={resultRef} className={styles.contentContainer}>
        {/* Score Overview Card */}
        <Card>
          <div className={styles.scoreDetails}>
            <Text size={500} weight="semibold">{attempt.quiz.title}</Text>
            
            <div className={styles.scoreNumber}>
              <Text size={1000} weight="bold" style={{ color: progressColor }}>
                {Math.round(attempt.scorePercentage)}%
              </Text>
            </div>
            
            <div className={styles.progressBarContainer}>
              <ProgressBar value={attempt.scorePercentage / 100} color={scoreColor} thickness="large" />
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statCol}>
                <Text size={300}>Correct</Text><br/>
                <Text size={600} weight="bold" style={{ color: "green" }}>{attempt.correctCount}</Text>
              </div>
              <div className={styles.statCol}>
                <Text size={300}>Incorrect</Text><br/>
                <Text size={600} weight="bold" style={{ color: "red" }}>{attempt.wrongCount}</Text>
              </div>
              <div className={styles.statCol}>
                <Text size={300}>Time Taken</Text><br/>
                <Text size={600} weight="bold">{Math.floor(attempt.timeTakenSec / 60)}m {attempt.timeTakenSec % 60}s</Text>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Review Modal Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={(_, d) => setIsReviewOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              Detailed Review
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Accordion multiple collapsible>
                {attempt.quiz.questions.map((question: any, index: number) => {
                  const answer = attempt.answers.find((a: any) => a.questionId === question.id);
                  const isCorrect = answer?.isCorrect;
                  
                  return (
                    <AccordionItem value={`item-${index}`} key={question.id}>
                      <AccordionHeader size="large" expandIconPosition="end">
                        <div className={styles.accordionHeaderContent}>
                          <Badge color={isCorrect ? "success" : "danger"} shape="rounded">
                            {index + 1}
                          </Badge>
                          <Text weight={isCorrect ? "regular" : "semibold"} style={{ color: isCorrect ? "inherit" : "#d13438" }}>
                            {question.text}
                          </Text>
                        </div>
                      </AccordionHeader>
                      <AccordionPanel>
                        <div className={styles.accordionPanelContent}>
                          
                          <div className={styles.correctAnswerBlock}>
                            <Text weight="bold">Correct Answer: </Text>
                            <Text>{question.correctAnswer}</Text>
                          </div>

                          {!isCorrect && answer && (
                            <div className={styles.wrongAnswerBlock}>
                              <Text weight="bold">Your Answer: </Text>
                              <Text>{answer.selectedAnswer}</Text>
                            </div>
                          )}

                          <div className={styles.explanationBlock}>
                            <Text weight="bold">Explanation: </Text>
                            <Text>{question.description}</Text>
                          </div>

                          <div className={styles.deepDiveRow}>
                            <Button 
                              appearance="outline" 
                              onClick={() => handleElaborate(question.id)}
                              disabled={elaborations[question.id]?.loading && activeElaborationId === question.id}
                            >
                              {elaborations[question.id]?.loading && activeElaborationId === question.id
                                ? <Spinner size="tiny" />
                                : elaborations[question.id]?.data
                                  ? "⚡ View Deep Dive"
                                  : "🤖 Generate Deep Dive"
                              }
                            </Button>
                            {elaborations[question.id]?.data && (
                              <Link href={`/deep-dives/${question.id}`} className={styles.link}>
                                <Button appearance="subtle" size="small" style={{ color: "#667eea" }}>Open Full Page →</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Close</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* AI Deep Dive Overlay Drawer */}
      <OverlayDrawer 
        open={isDrawerOpen} 
        onOpenChange={(e, data) => setIsDrawerOpen(data.open)}
        position="end"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" onClick={() => setIsDrawerOpen(false)}>
                Close
              </Button>
            }
          >
            AI Deep Dive
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          {activeElaborationId && (
            <div className={styles.drawerBody}>
              {elaborations[activeElaborationId]?.loading && (
                <div className={styles.drawerSpinner}>
                  <Spinner label="AI is thinking..." />
                </div>
              )}
              {elaborations[activeElaborationId]?.error && (
                <MessageBar intent="error">
                  <MessageBarBody>{elaborations[activeElaborationId].error}</MessageBarBody>
                </MessageBar>
              )}
              {elaborations[activeElaborationId]?.data && (
                <div className="markdown-body" style={{ overflowX: "auto" }}>
                  <ReactMarkdown>{elaborations[activeElaborationId].data as string}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </DrawerBody>
      </OverlayDrawer>
    </div>
  );
}

