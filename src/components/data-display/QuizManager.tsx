"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Link as LinkIcon,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { Alert } from "@/components/ui/Alert";
import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { EditQuizBody, QuizDrawerBody } from "@/components/data-display/QuizManagerBodies";
import { QuestionEditorBody } from "@/components/data-display/QuestionEditorBody";
import { Pagination } from "@/components/data-display/Pagination";
import { SearchFilterBar } from "@/components/data-display/SearchFilterBar";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";

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

  // Dialog / panel hooks
  const dialog = useDialog();
  const panel = usePanel();

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
    dialog.confirm({ title, description, onConfirm });

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

  // Load active quiz details when drawer opens
  useEffect(() => {
    if (selectedQuizId) {
      fetchActiveQuizDetail(selectedQuizId);
    } else {
      setActiveQuizDetail(null);
    }
  }, [selectedQuizId]);

  // Open quiz detail drawer via the shared panel host
  useEffect(() => {
    if (!selectedQuizId) return;
    const quiz = quizzes.find(q => q.id === selectedQuizId) || null;
    panel.open({
      title: `Quiz details: ${quiz?.title ?? ""}`,
      width: "max-w-2xl",
      onClose: () => setSelectedQuizId(null),
      body: (
        <QuizDrawerBody
          quiz={quiz}
          detail={activeQuizDetail}
          loading={activeQuizLoading}
          onUnlinkTopic={handleUnlinkTopic}
          onAddQuestion={handleOpenAddQuestion}
          onEditQuestion={handleOpenEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
        />
      ),
    });
  }, [selectedQuizId, activeQuizDetail, activeQuizLoading, quizzes]);

  // Available subtopics (topics that have a parent - not root curriculums)
  const availableSubtopics = useMemo(() => {
    return topics.filter(t => t.parentTopics && t.parentTopics.length > 0);
  }, [topics]);

  // Open Edit Quiz Dialog
  const openEditDialog = (quiz: Quiz) => {
    const form = {
      id: quiz.id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      quizOrder: quiz.quizOrder ? quiz.quizOrder.toString() : ""
    };
    setQuizForm(form);
    setError(null);
    dialog.open({
      title: "Edit Quiz",
      onOk: handleSaveQuiz,
      body: <EditQuizBody form={form} onChange={setQuizForm} />,
    });
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
    dialog.open({
      title: "Link / Unlink Topics",
      okText: "Save Links",
      onOk: handleSaveLinks,
      body: (
        <LinkPicker
          description="Select the subtopics this quiz should appear under. A quiz can be linked to multiple topics."
          label="Subtopics"
          placeholder="Search subtopics..."
          items={availableSubtopics}
          selectedIds={selectedTopicIds}
          onSelectionChange={setSelectedTopicIds}
        />
      ),
    });
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

  // Open Generate Quiz Dialog (AI-powered)
  const openGenerateDialog = () => {
    dialog.open({
      title: "Generate Quiz with AI",
      showClose: true,
      body: (
        <GenerateQuizForm
          onSuccess={async () => {
            await fetchQuizzes();
            dialog.close();
          }}
        />
      ),
    });
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
    const form = {
      id: "",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      hint: "",
      description: ""
    };
    setQuestionForm(form);
    setError(null);
    dialog.open({
      title: "Add Question",
      onOk: handleSaveQuestion,
      body: <QuestionEditorBody form={form} onChange={setQuestionForm} onOptionChange={handleOptionChange} loading={loading} />,
    });
  };

  // Open Edit Question inside Drawer
  const handleOpenEditQuestion = (q: QuizQuestionDetail) => {
    const form = {
      id: q.id,
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      hint: q.hint || "",
      description: q.description || ""
    };
    setQuestionForm(form);
    setError(null);
    dialog.open({
      title: "Edit Question",
      onOk: handleSaveQuestion,
      body: <QuestionEditorBody form={form} onChange={setQuestionForm} onOptionChange={handleOptionChange} loading={loading} />,
    });
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
          onClick={openGenerateDialog}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Generate Quiz</span>
        </Button>
      </div>

      {/* Toolbar Search & Filter Box */}
      {quizzes.length > 0 && (
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          searchPlaceholder="Search quiz title or linked topic..."
          filterValue={difficultyFilter}
          onFilterChange={v => { setDifficultyFilter(v); setCurrentPage(1); }}
          filterOptions={DIFFICULTIES.map(d => ({ value: d, label: d }))}
          filterPlaceholder="All Difficulties"
        />
      )}

      {/* Main Table or Empty State */}
      {quizzes.length === 0 ? (
        <NoData 
          title="No Quizzes Yet" 
          description="Create standalone quizzes here, then link them to subtopics to make them discoverable in the public view." 
          icon="warning"
          action={
            <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={openGenerateDialog}>
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
                      <Badge variant={difficultyColor(item.difficulty)} className="capitalize font-bold text-[8px] px-2 py-0.5">
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
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageSizeChange={v => { setPageSize(v); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

    </div>
  );
}
export default QuizManager;
