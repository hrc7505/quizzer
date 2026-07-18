"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  X,
  MoreHorizontal,
  BookOpen,
  Sparkles,
  Loader2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { Alert } from "@/components/ui/Alert";
import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions } from "@/components/ui/Dialog";
import { Sheet, SheetContent, SheetHeader, SheetBody } from "@/components/ui/Sheet";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

interface TopicRef {
  id: string;
  title: string;
  parentTopics?: { id: string }[];
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  topics: TopicRef[];
  _count: { questions: number; attempts: number };
}

interface QuizManagerProps {
  /** All quizzes from DB, pre-fetched server-side. */
  quizzes: Quiz[];
  /** All topics available for linking. */
  topics: TopicRef[];
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

/**
 * QuizManager — full CRUD management table for quizzes.
 * Supports create, edit, delete, link/unlink subtopics, search, filter, paginate.
 */
export function QuizManager({ quizzes: initial, topics }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  // Form state
  const [quizForm, setQuizForm] = useState({ id: "", title: "", difficulty: "Medium", quizOrder: "" });
  const [linkQuizId, setLinkQuizId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Detail drawer state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  
  interface QuizQuestionDetail {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    hint?: string | null;
    description?: string | null;
  }

  interface QuizDetail {
    id: string;
    title: string;
    difficulty: string;
    quizOrder: number;
    questions?: QuizQuestionDetail[];
  }

  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizDetail | null>(null);
  const [activeQuizLoading, setActiveQuizLoading] = useState(false);

  // Question Form / Dialog State
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  // Filter / pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // Refresh quizzes list
  const fetchQuizzes = async () => {
    const res = await fetch("/api/admin/quizzes");
    const data = await res.json();
    if (Array.isArray(data)) setQuizzes(data);
  };

  // Re-fetch active quiz questions in drawer
  const fetchActiveQuizDetail = async (id: string) => {
    setActiveQuizLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`);
      const data = await res.json();
      if (!data.error) setActiveQuizDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setActiveQuizLoading(false);
    }
  };

  // Filter quizzes by search query and difficulty
  const filtered = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiff = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchSearch && matchDiff;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Load active quiz details when drawer opens
  useEffect(() => {
    if (selectedQuizId) {
      fetchActiveQuizDetail(selectedQuizId);
    } else {
      setActiveQuizDetail(null);
    }
  }, [selectedQuizId]);

  // Available subtopics (topics that have a parent - not root curriculums)
  const availableSubtopics = useMemo(() => {
    return topics.filter(t => t.parentTopics && t.parentTopics.length > 0);
  }, [topics]);

  // Open Edit Quiz Dialog
  const openEditDialog = (quiz: Quiz) => {
    setQuizForm({
      id: quiz.id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      quizOrder: quiz.quizOrder ? quiz.quizOrder.toString() : ""
    });
    setError(null);
    setQuizDialogOpen(true);
  };

  // Save Quiz (Edit Only)
  const handleSaveQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizForm.title,
          difficulty: quizForm.difficulty,
          quizOrder: quizForm.quizOrder ? parseInt(quizForm.quizOrder) : null
        })
      });
      const data = await res.json();
      if (!data.error) {
        setQuizDialogOpen(false);
        await fetchQuizzes();
      } else {
        setError(data.error || "Failed to edit quiz");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = (quiz: Quiz) => {
    triggerConfirm(
      "Delete Quiz",
      `Are you sure you want to permanently delete "${quiz.title}"? This will delete all of its ${quiz._count.questions} questions, as well as all attempts and score history.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
        setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
        if (selectedQuizId === quiz.id) setSelectedQuizId(null);
        setLoading(false);
      }
    );
  };

  // Open Link Dialog
  const openLinkDialog = (quiz: Quiz) => {
    setLinkQuizId(quiz.id);
    setSelectedTopicIds(quiz.topics.map(t => t.id));
    setError(null);
    setLinkDialogOpen(true);
  };

  // Save linked topics
  const handleSaveLinks = async () => {
    if (!linkQuizId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${linkQuizId}/link-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedTopicIds })
      });
      const data = await res.json();
      if (!data.error) {
        setLinkDialogOpen(false);
        await fetchQuizzes();
      } else {
        setError(data.error || "Failed to link topics");
      }
    } catch {
      setError("Failed to link topics");
    } finally {
      setLoading(false);
    }
  };

  // Unlink specific topic from drawer
  const handleUnlinkTopic = async (quizId: string, quizTitle: string, topicId: string, topicTitle: string) => {
    triggerConfirm(
      "Unlink Topic",
      `Are you sure you want to unlink "${quizTitle}" from "${topicTitle}"?`,
      async () => {
        setLoading(true);
        const currentLinked = quizzes.find(q => q.id === quizId)?.topics.map(t => t.id) || [];
        const nextLinked = currentLinked.filter(id => id !== topicId);
        
        await fetch(`/api/admin/quizzes/${quizId}/link-topics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicIds: nextLinked })
        });
        
        await fetchQuizzes();
        setLoading(false);
      }
    );
  };

  // Open Add Question inside Drawer
  const handleOpenAddQuestion = () => {
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

  // Open Edit Question inside Drawer
  const handleOpenEditQuestion = (q: QuizQuestionDetail) => {
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

  // Save question (inside drawer)
  const handleSaveQuestion = async () => {
    if (!selectedQuizId) return;
    setLoading(true);
    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: selectedQuizId,
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
        await fetchActiveQuizDetail(selectedQuizId);
        await fetchQuizzes();
      } else {
        setError(data.error || "Failed to save question");
      }
    } catch {
      setError("Error saving question");
    } finally {
      setLoading(false);
    }
  };

  // Delete question (inside drawer)
  const handleDeleteQuestion = (questionId: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        if (!selectedQuizId) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            await fetchActiveQuizDetail(selectedQuizId);
            await fetchQuizzes();
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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Quizzes</span>
            <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
              {quizzes.length}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage quizzes, link topics, and inspect questions.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
          onClick={() => setGenerateDialogOpen(true)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Generate Quiz</span>
        </Button>
      </div>

      {/* Toolbar Search & Filter Box */}
      {quizzes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search quiz title or linked topic..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={difficultyFilter}
              onChange={e => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
              className="h-10"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
        </div>
      )}

      {/* Main Table or Empty State */}
      {quizzes.length === 0 ? (
        <NoData 
          title="No Quizzes Yet" 
          description="Create standalone quizzes here, then link them to subtopics to make them discoverable in the public view." 
          icon="warning"
          action={
            <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate First Quiz</span>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/80 shadow-xs overflow-hidden p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10">
                  <th scope="col" className="py-3.5 px-4 font-bold w-16 text-center">Order</th>
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Difficulty</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Questions</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Attempts</th>
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-xs">Linked Topics</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-muted-foreground">
                      #{item.quizOrder}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedQuizId(item.id)}
                        className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer block max-w-sm truncate border-0 bg-transparent p-0"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <Badge variant={difficultyBadgeVariant(item.difficulty)} className="capitalize font-bold text-[8px] px-2 py-0.5">
                        {item.difficulty}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-foreground/90">{item._count.questions}</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground/80">{item._count.attempts}</td>
                    <td className="py-3 px-4 max-w-xs select-none">
                      <div className="flex flex-wrap gap-1">
                        {item.topics.length > 0 ? (
                          item.topics.map(t => (
                            <Badge key={t.id} variant="secondary" className="text-[8px] px-1.5 py-0">
                              {t.title}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[9px] text-muted-foreground/60 italic font-medium">Unlinked</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openLinkDialog(item)}
                          className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                          aria-label="Link topics"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                        </Button>
                        
                        <Dropdown>
                          <DropdownTrigger>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent align="right" className="w-44">
                            <DropdownItem onClick={() => openEditDialog(item)}>Edit Details</DropdownItem>
                            <DropdownItem onClick={() => setSelectedQuizId(item.id)}>Manage Questions</DropdownItem>
                            <DropdownItem onClick={() => handleDeleteQuiz(item)} className="text-danger">Delete Quiz</DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 gap-4 bg-secondary/5 text-xs select-none">
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
        </Card>
      )}

      {/* ── Generate Quiz Dialog (AI-powered) ── */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogSurface className="max-w-[540px]">
          <DialogTitle>Generate Quiz with AI</DialogTitle>
          <DialogContent className="mt-3">
            <GenerateQuizForm onSuccess={async () => {
              await fetchQuizzes();
              setGenerateDialogOpen(false);
            }} />
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* ── Edit Quiz Dialog ── */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogSurface className="max-w-[440px]">
          <DialogTitle>Edit Quiz</DialogTitle>
          <DialogContent className="flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quiz Title <span className="text-danger">*</span></label>
              <Input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty <span className="text-danger">*</span></label>
              <Select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))} required>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order / Position</label>
              <Input type="number" placeholder="Leave blank for auto" value={quizForm.quizOrder} onChange={e => setQuizForm(f => ({ ...f, quizOrder: e.target.value }))} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveQuiz} disabled={!quizForm.title || loading}>
              Save
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* ── Link Topics Dialog ── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogSurface className="max-w-[480px]">
          <DialogTitle>Link / Unlink Topics</DialogTitle>
          <DialogContent className="flex flex-col gap-3 mt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select the subtopics this quiz should appear under. A quiz can be linked to multiple topics.
            </p>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtopics</label>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto border border-border/80 rounded-xl p-3 bg-secondary/5 mt-0.5 select-none">
                {availableSubtopics.map(t => {
                  const isChecked = selectedTopicIds.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-2.5 p-1.5 hover:bg-surface-hover rounded-lg cursor-pointer text-xs font-semibold text-foreground/90 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedTopicIds(prev =>
                            isChecked ? prev.filter(id => id !== t.id) : [...prev, t.id]
                          );
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveLinks} disabled={loading}>
              Save Links
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* ── Quiz Details Overlay Drawer Sheet ── */}
      <Sheet open={!!selectedQuizId} onOpenChange={open => !open && setSelectedQuizId(null)}>
        <SheetContent className="max-w-2xl">
          <SheetHeader>Quiz details: {activeQuiz?.title}</SheetHeader>
          <SheetBody className="flex flex-col gap-6">
            
            {/* Linked topics section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5 select-none">
                Linked Topics
              </h3>
              
              {activeQuiz?.topics && activeQuiz.topics.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 select-none">
                  {activeQuiz.topics.map(t => (
                    <div key={t.id} className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/5 text-primary border border-primary/20 rounded-lg text-xs font-semibold">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.title}</span>
                      <button
                        onClick={() => activeQuiz && handleUnlinkTopic(activeQuiz.id, activeQuiz.title, t.id, t.title)}
                        className="text-primary/60 hover:text-danger cursor-pointer shrink-0 ml-1 active:scale-95 duration-100"
                        title="Unlink topic"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <NoData
                  title="No topics linked."
                  description='Click "Link Topics" to associate this quiz with subtopics.'
                  icon="book"
                  compact={true}
                />
              )}
            </div>

            {/* Questions section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Questions ({activeQuizDetail?.questions?.length || 0})
                </h3>
                <Button variant="outline" size="sm" className="h-8 font-semibold text-xs gap-1.5" onClick={handleOpenAddQuestion}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </Button>
              </div>

              {activeQuizLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground select-none">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span>Loading questions...</span>
                </div>
              ) : activeQuizDetail?.questions && activeQuizDetail.questions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {activeQuizDetail.questions.map((q, idx: number) => (
                    <Card key={q.id} className="p-5 border border-border/80 bg-card shadow-sm flex flex-col gap-4 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-xs font-bold text-foreground leading-snug">
                          {idx + 1}. {q.text}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg border border-border/50 bg-surface"
                            onClick={() => handleOpenEditQuestion(q)}
                            aria-label="Edit question"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                            onClick={() => handleDeleteQuestion(q.id, q.text)}
                            aria-label="Delete question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 select-none">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div 
                              key={oIdx} 
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold",
                                isCorrect 
                                  ? "border-success/20 bg-success/5 text-success" 
                                  : "border-border/40 bg-card text-foreground/70"
                              )}
                            >
                              <span className="opacity-75">{oIdx + 1}.</span>
                              <span className="truncate">{opt} {isCorrect && "✓"}</span>
                            </div>
                          );
                        })}
                      </div>

                      {(q.hint || q.description) && (
                        <div className="flex flex-col gap-1.5 bg-secondary/10 rounded-lg p-3 text-[10px] text-muted-foreground border border-border/30 select-none">
                          {q.hint && (
                            <div>
                              <strong className="text-foreground/90 font-bold">Hint:</strong> <span className="font-medium text-muted-foreground/95">{q.hint}</span>
                            </div>
                          )}
                          {q.description && (
                            <div className={cn(q.hint && "border-t border-border/20 pt-1.5 mt-0.5")}>
                              <strong className="text-foreground/90 font-bold">Explanation:</strong> <span className="font-medium text-muted-foreground/95 whitespace-pre-wrap">{q.description}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <NoData
                  title="No questions linked."
                  description='Click "Add Question" to build questions manually.'
                  icon="book"
                  compact={true}
                />
              )}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* ── Add / Edit Question Dialog (Inside Drawer context) ── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogSurface className="max-w-[600px]">
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
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSaveQuestion} 
              disabled={!questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || loading}
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
export default QuizManager;
