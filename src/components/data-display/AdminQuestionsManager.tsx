"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Search, AlertTriangle, Loader2, X } from "lucide-react";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions } from "@/components/ui/Dialog";
import { cn } from "@/utils/cn";

interface QuizRef {
  id: string;
  title: string;
  topics: { id: string; title: string }[];
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
  quizId: string | null;
  quiz?: {
    id: string;
    title: string;
  } | null;
  topic?: {
    id: string;
    title: string;
  } | null;
}

interface AdminQuestionsManagerProps {
  /** List of all questions in DB. */
  questions: Question[];
  /** List of all quizzes (to assign questions to). */
  quizzes: QuizRef[];
}

/**
 * AdminQuestionsManager — administrative management panel for individual questions.
 * Supports manual create, edit, delete, searching, and filtering by quiz.
 */
export function AdminQuestionsManager({ questions: initial, quizzes }: AdminQuestionsManagerProps) {
  const [questions, setQuestions] = useState<Question[]>(initial);
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
    quizId: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  // Filter / pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // Refresh questions list
  const fetchQuestions = async () => {
    const res = await fetch("/api/admin/questions");
    const data = await res.json();
    if (Array.isArray(data)) setQuestions(data);
  };

  const filtered = questions.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.quiz && q.quiz.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchQuiz = !quizFilter || q.quizId === quizFilter;
    return matchSearch && matchQuiz;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setQuestionForm({
      id: "",
      quizId: quizzes[0]?.id || "",
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
      quizId: q.quizId || "",
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
      quizId: questionForm.quizId,
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
        await fetchQuestions();
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

  const handleDelete = (q: Question) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${q.text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" });
        setQuestions(prev => prev.filter(item => item.id !== q.id));
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Questions Directory</span>
            <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
              {questions.length}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspect, search, edit, or manually compose questions for any quiz.
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          <span>Add Question</span>
        </Button>
      </div>

      {/* Toolbar Search & Filter Box */}
      {questions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search by question text or quiz..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={quizFilter}
              onChange={e => { setQuizFilter(e.target.value); setCurrentPage(1); }}
              className="h-10"
            >
              <option value="">All Quizzes</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 ? (
        <NoData 
          title="No Questions Found" 
          description="There are no questions populated in the database. You can generate a quiz with AI or add individual questions manually." 
          icon="book"
          action={
            <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Question</span>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Card list of questions */}
          <div className="flex flex-col gap-5">
            {paginated.map((q, idx) => (
              <Card key={q.id} className="p-6 border border-border/80 bg-card shadow-sm flex flex-col gap-5 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap select-none">
                      <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                        Quiz: {q.quiz?.title || "Unassigned"}
                      </Badge>
                      {q.topic && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          Topic: {q.topic.title}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {(currentPage - 1) * pageSize + idx + 1}. {q.text}
                    </h3>
                  </div>

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
                      onClick={() => handleDelete(q)}
                      aria-label="Delete Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

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

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border border-border/80 rounded-2xl gap-4 bg-secondary/5 text-xs select-none">
            <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
              <span>Show</span>
              <Select 
                value={pageSize.toString()} 
                onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} 
                className="h-8 w-16"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <span>entries</span>
            </div>

            <span className="text-muted-foreground/80 font-medium">
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </span>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-8 font-semibold text-xs"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-8 font-semibold text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogSurface className="max-w-[640px]">
          <DialogTitle>{questionForm.id ? "Edit Question" : "Add Question"}</DialogTitle>
          <DialogContent className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parent Quiz <span className="text-danger">*</span></label>
              <Select 
                value={questionForm.quizId} 
                onChange={e => setQuestionForm(prev => ({ ...prev, quizId: e.target.value }))}
                required
              >
                <option value="">Select quiz assignment...</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </Select>
            </div>

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
                    placeholder={`Enter option ${idx + 1}`} 
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
                {questionForm.options.map((opt, idx) => (
                  opt.trim() && <option key={idx} value={opt}>{opt}</option>
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
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Explanation / Description</label>
              <Textarea 
                value={questionForm.description} 
                onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Explain why this answer is correct..." 
                rows={3}
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
              disabled={!questionForm.quizId || !questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || loading}
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
export default AdminQuestionsManager;
