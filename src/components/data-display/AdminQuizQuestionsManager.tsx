"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ArrowLeft, X, AlertTriangle, Loader2 } from "lucide-react";
import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

interface QuizDetail {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  questions: Question[];
  topics: { id: string; title: string }[];
}

interface AdminQuizQuestionsManagerProps {
  /** The parent quiz detail pre-fetched server side. */
  quiz: QuizDetail;
}

/**
 * AdminQuizQuestionsManager — dedicated page component to manage questions for a single quiz.
 * Displays questions in cards with inline option lists and edit/delete controls.
 */
export function AdminQuizQuestionsManager({ quiz: initialQuiz }: AdminQuizQuestionsManagerProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail>(initialQuiz);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog & confirm states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  // Form state
  const [questionForm, setQuestionForm] = useState({
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // Re-fetch quiz data
  const refreshQuiz = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`);
      const data = await res.json();
      if (!data.error) {
        setQuiz(data);
      }
    } catch (e) {
      console.error("Failed to refresh quiz questions:", e);
    }
  };

  const handleOpenAdd = () => {
    setQuestionForm({
      id: "",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      hint: "",
      description: ""
    });
    setError(null);
    setQuestionDialogOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setQuestionForm({
      id: q.id,
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      hint: q.hint || "",
      description: q.description || ""
    });
    setError(null);
    setQuestionDialogOpen(true);
  };

  const handleOptionChange = (idx: number, val: string) => {
    setQuestionForm(prev => {
      const newOpts = [...prev.options];
      newOpts[idx] = val;
      let newCorrect = prev.correctAnswer;
      if (prev.correctAnswer === prev.options[idx]) {
        newCorrect = val;
      }
      return { ...prev, options: newOpts, correctAnswer: newCorrect };
    });
  };

  const handleSaveQuestion = async () => {
    setLoading(true);
    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: quiz.id,
      text: questionForm.text,
      options: questionForm.options,
      correctAnswer: questionForm.correctAnswer,
      hint: questionForm.hint,
      description: questionForm.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.error) {
        setQuestionDialogOpen(false);
        await refreshQuiz();
      } else {
        setError(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      setError("Error saving question");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (questionId: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            await refreshQuiz();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "default";
  };

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

      {/* Back navigation & breadcrumbs */}
      <div className="flex flex-col gap-3 select-none">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
          <span>Manage Quizzes</span>
          <span>/</span>
          <span className="text-foreground">{quiz.title}</span>
          <span>/</span>
          <span>Questions</span>
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{quiz.title} Questions</h1>
            <Badge variant={difficultyBadgeVariant(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 select-none">
              {quiz.difficulty}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compose, modify, or remove questions linked to this quiz.
          </p>
        </div>

        <Button variant="primary" className="h-9 px-4 font-semibold text-xs gap-1.5 shadow-xs" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          <span>Add Question</span>
        </Button>
      </div>

      {/* Questions list */}
      {quiz.questions.length === 0 ? (
        <NoData 
          title="No Questions Yet" 
          description="This quiz has no questions. Click Add Question below to add a question manually." 
          icon="book"
          action={
            <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Question</span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} className="p-6 border border-border/80 bg-card shadow-sm flex flex-col gap-5 rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-semibold text-foreground leading-snug">
                  {idx + 1}. {q.text}
                </h3>

                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg border border-border/50 bg-surface"
                    onClick={() => handleOpenEdit(q)}
                    aria-label="Edit Question"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                    onClick={() => handleDelete(q.id, q.text)}
                    aria-label="Delete Question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div 
                      key={oIdx} 
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold select-none",
                        isCorrect 
                          ? "border-success/30 bg-success/10 text-success" 
                          : "border-border/60 bg-card text-foreground/80"
                      )}
                    >
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[9px] border",
                        isCorrect 
                          ? "bg-success text-white border-success/10" 
                          : "bg-secondary text-muted-foreground/80 border-border/80"
                      )}>
                        {oIdx + 1}
                      </span>
                      <span className="truncate">{opt} {isCorrect && "✓"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Hint and Description Extras */}
              {(q.hint || q.description) && (
                <div className="flex flex-col gap-2 bg-secondary/20 rounded-xl p-4 text-xs text-muted-foreground border border-border/40 select-none">
                  {q.hint && (
                    <div>
                      <strong className="text-foreground/90 font-bold">Hint:</strong> <span className="font-medium text-muted-foreground/95">{q.hint}</span>
                    </div>
                  )}
                  {q.description && (
                    <div className={cn(q.hint && "border-t border-border/30 pt-2 mt-1")}>
                      <strong className="text-foreground/90 font-bold">Explanation:</strong> <span className="font-medium text-muted-foreground/95 whitespace-pre-wrap">{q.description}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogSurface className="max-w-[640px]">
          <DialogTitle>{questionForm.id ? "Edit Question" : "Add Question"}</DialogTitle>
          <DialogContent className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
              <Textarea
                value={questionForm.text}
                onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter the question text..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {idx + 1} <span className="text-danger">*</span></label>
                  <Input
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correct Answer <span className="text-danger">*</span></label>
              <Select
                value={questionForm.correctAnswer}
                onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                required
              >
                <option value="">Select correct option...</option>
                {questionForm.options.filter(Boolean).map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hint (Optional)</label>
              <Input
                value={questionForm.hint}
                onChange={e => setQuestionForm(prev => ({ ...prev, hint: e.target.value }))}
                placeholder="Enter a brief hint..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Explanation / Description <span className="text-danger">*</span></label>
              <Textarea
                value={questionForm.description}
                onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Explain why this answer is correct..."
                rows={3}
                required
              />
            </div>
          </DialogContent>
          
          <DialogActions>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveQuestion}
              disabled={!questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || !questionForm.description || loading}
              className="gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save</span>
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* ── Confirmation Dialog ── */}
      <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(p => ({ ...p, open }))}>
        <DialogSurface className="max-w-[420px]">
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <div className="flex gap-3.5 items-start mt-2">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                {confirmDialog.description}
              </span>
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setConfirmDialog(p => ({ ...p, open: false }))}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await confirmDialog.onConfirm();
                setConfirmDialog(p => ({ ...p, open: false }));
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
export default AdminQuizQuestionsManager;
