"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Download, GitMerge, CheckSquare, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { Alert } from "@/components/ui/Alert";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { EditQuizBody, QuizDrawerBody } from "@/components/data-display/QuizManagerBodies";
import { QuestionEditorBody } from "@/components/data-display/QuestionEditorBody";
import { DeleteConfirmDialogBody } from "@/components/feedback/DeleteConfirmDialogBody";
import { MergeQuizzesDialogBody } from "@/components/data-display/MergeQuizzesDialogBody";
import { downloadCSV } from "@/lib/csv-export";
import { Pagination } from "@/components/data-display/Pagination";
import { SearchFilterBar } from "@/components/data-display/SearchFilterBar";
import { PageHeader } from "@/components/data-display/PageHeader";
import { QuizRow } from "@/components/data-display/QuizRow";
import { soundEffects } from "@/lib/services/sound-effects.service";

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
 * Supports create, edit, delete, link/unlink subtopics, search, filter, paginate,
 * multi-select quiz merging, and AI question appending.
 */
export function QuizManager({ quizzes: initial, topics }: QuizManagerProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-selection state for merging
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);

  // Dialog / panel / toast hooks
  const dialog = useDialog();
  const panel = usePanel();
  const toast = useToast();

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

  const filtered = useMemo(() => {
    return quizzes.filter(q => {
      const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDiff = !difficultyFilter || q.difficulty === difficultyFilter;
      return matchSearch && matchDiff;
    });
  }, [quizzes, searchQuery, difficultyFilter]);

  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalItems = filtered.length;

  // Toggle single quiz selection
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedQuizIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length >= 2) {
        soundEffects.playPopSound();
      } else if (prev.length >= 2 && next.length < 2) {
        soundEffects.playClearSound();
      }
      return next;
    });
  }, []);

  // Toggle select all on current page
  const handleToggleSelectAll = useCallback(() => {
    const pageIds = paginated.map(q => q.id);
    const allSelected = pageIds.every(id => selectedQuizIds.includes(id));
    if (allSelected) {
      soundEffects.playClearSound();
      setSelectedQuizIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      soundEffects.playPopSound();
      setSelectedQuizIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  }, [paginated, selectedQuizIds]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Title", "Difficulty", "Order", "Questions", "Attempts", "Linked Topics"];
    const rows = filtered.map(q => [
      q.title,
      q.difficulty,
      String(q.quizOrder),
      String(q._count.questions),
      String(q._count.attempts),
      q.topics.map(t => t.title).join("; "),
    ]);
    downloadCSV("quizzes.csv", headers, rows);
    toast.addToast({ type: "success", message: `Exported ${filtered.length} quizzes` });
  }, [filtered, toast]);

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

  // Load active quiz details when drawer opens
  useEffect(() => {
    if (selectedQuizId) {
      Promise.resolve().then(() => {
        fetchActiveQuizDetail(selectedQuizId);
      });
    } else {
      Promise.resolve().then(() => {
        setActiveQuizDetail(null);
      });
    }
  }, [selectedQuizId]);

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
        toast.addToast({ type: "success", message: "Quiz updated" });
      } else {
        setError(data.error || "Failed to edit quiz");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete Quiz confirmation
  const handleDeleteQuiz = (quiz: Quiz) => {
    dialog.open({
      title: "Delete Quiz",
      body: (
        <DeleteConfirmDialogBody
          title={quiz.title}
          itemType="quiz"
          linkSummaries={[
            { label: "Questions", items: quiz._count.questions },
            { label: "Linked Topics", items: quiz.topics.map((t) => t.title) },
            { label: "Attempts", items: quiz._count.attempts },
          ]}
        />
      ),
      okText: "Delete",
      okVariant: "danger",
      onOk: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            await fetchQuizzes();
            setSelectedQuizIds(prev => prev.filter(id => id !== quiz.id));
            toast.addToast({ type: "success", message: "Quiz deleted" });
          }
        } catch {
          setError("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Open Link Topics dialog
  const openLinkDialog = (quiz: Quiz) => {
    setLinkQuizId(quiz.id);
    setSelectedTopicIds(quiz.topics.map(t => t.id));
    setError(null);
    dialog.open({
      title: `Link Subtopics to "${quiz.title}"`,
      onOk: handleSaveTopicLinks,
      body: (
        <LinkPicker
          label="Subtopics"
          items={availableSubtopics}
          selectedIds={quiz.topics.map(t => t.id)}
          onSelectionChange={setSelectedTopicIds}
          emptyHint="No subtopics found"
        />
      ),
    });
  };

  // Save Link Topics
  const handleSaveTopicLinks = async () => {
    if (!linkQuizId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${linkQuizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedTopicIds })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchQuizzes();
        toast.addToast({ type: "success", message: "Topic links updated" });
      } else {
        setError(data.error || "Failed to update links");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Unlink a single topic from active quiz
  const handleUnlinkTopic = async (topicId: string) => {
    if (!selectedQuizId) return;
    const quiz = quizzes.find(q => q.id === selectedQuizId);
    if (!quiz) return;

    triggerConfirm(
      "Unlink Subtopic",
      "Are you sure you want to unlink this subtopic? The quiz and its questions will not be deleted.",
      async () => {
        const remainingTopicIds = quiz.topics.map(t => t.id).filter(id => id !== topicId);
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/quizzes/${selectedQuizId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicIds: remainingTopicIds })
          });
          const data = await res.json();
          if (!data.error) {
            await fetchQuizzes();
            toast.addToast({ type: "success", message: "Subtopic unlinked" });
          } else {
            setError(data.error || "Failed to unlink topic");
          }
        } catch {
          setError("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Save Question in active quiz
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
        toast.addToast({ type: "success", message: "Question saved" });
      } else {
        setError(data.error || "Failed to save question");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Open Question Edit Modal
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
    dialog.open({
      title: "Edit Question",
      onOk: handleSaveQuestion,
      body: (
        <QuestionEditorBody
          form={form}
          onChange={(updater) => setQuestionForm((prev) => updater(prev))}
          onOptionChange={(idx, val) => {
            setQuestionForm((prev) => {
              const opts = [...prev.options];
              opts[idx] = val;
              return { ...prev, options: opts };
            });
          }}
        />
      ),
    });
  };

  // Open Question Add Modal
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
    dialog.open({
      title: "Add Question",
      onOk: handleSaveQuestion,
      body: (
        <QuestionEditorBody
          form={form}
          onChange={(updater) => setQuestionForm((prev) => updater(prev))}
          onOptionChange={(idx, val) => {
            setQuestionForm((prev) => {
              const opts = [...prev.options];
              opts[idx] = val;
              return { ...prev, options: opts };
            });
          }}
        />
      ),
    });
  };

  // Delete Question confirmation
  const handleDeleteQuestion = (questionId: string) => {
    triggerConfirm(
      "Delete Question",
      "Are you sure you want to delete this question? This action cannot be undone.",
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (!data.error) {
            if (selectedQuizId) await fetchActiveQuizDetail(selectedQuizId);
            await fetchQuizzes();
            toast.addToast({ type: "success", message: "Question deleted" });
          } else {
            setError(data.error || "Failed to delete question");
          }
        } catch {
          setError("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Open Generate Quiz Dialog (Create New)
  const openGenerateDialog = () => {
    dialog.open({
      title: "Generate Quiz with AI",
      body: (
        <GenerateQuizForm
          onSuccess={async () => {
            dialog.close();
            await fetchQuizzes();
            toast.addToast({ type: "success", message: "New quiz created successfully!" });
          }}
        />
      ),
    });
  };

  // Open Append Questions Dialog (Append to Existing)
  const handleOpenAppendDialog = (quiz: Quiz) => {
    dialog.open({
      title: `AI Append Questions — ${quiz.title}`,
      body: (
        <GenerateQuizForm
          targetQuizId={quiz.id}
          targetQuizTitle={quiz.title}
          onSuccess={async () => {
            dialog.close();
            await fetchQuizzes();
            toast.addToast({
              type: "success",
              message: `Appended questions to "${quiz.title}"!`,
            });
          }}
        />
      ),
    });
  };

  // Open Merge Multiple Quizzes Dialog
  const handleOpenMergeDialog = () => {
    const selectedList = quizzes.filter(q => selectedQuizIds.includes(q.id));
    if (selectedList.length < 2) {
      toast.addToast({ type: "warning", message: "Please select at least 2 quizzes to merge." });
      return;
    }

    const initialState = {
      targetQuizId: selectedList[0].id,
      targetTitle: selectedList[0].title,
    };

    dialog.open({
      title: "Merge Quizzes",
      body: (
        <MergeQuizzesDialogBody
          selectedQuizzes={selectedList}
          initialForm={initialState}
          onConfirm={async (finalForm) => {
            const targetId = finalForm.targetQuizId || selectedList[0].id;
            const sourceIds = selectedList.map(q => q.id).filter(id => id !== targetId);

            setLoading(true);
            try {
              const res = await fetch("/api/admin/quizzes/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetQuizId: targetId,
                  sourceQuizIds: sourceIds,
                  targetTitle: finalForm.targetTitle,
                }),
              });

              const data = await res.json();
              if (res.ok && !data.error) {
                setSelectedQuizIds([]);
                await fetchQuizzes();
                toast.addToast({
                  type: "success",
                  message: data.message || `Successfully merged ${selectedList.length} quizzes!`,
                });
              } else {
                toast.addToast({
                  type: "error",
                  message: data.error || "Failed to merge quizzes",
                });
                throw new Error(data.error);
              }
            } catch (err) {
              console.error("Merge error:", err);
              toast.addToast({ type: "error", message: "An unexpected error occurred during merge" });
              throw err;
            } finally {
              setLoading(false);
            }
          }}
        />
      ),
    });
  };

  const callbacksRef = useRef<{
    handleUnlinkTopic: (id: string) => Promise<void>;
    handleOpenAddQuestion: () => void;
    handleOpenEditQuestion: (q: QuizQuestionDetail) => void;
    handleDeleteQuestion: (id: string) => void;
  } | null>(null);

  useEffect(() => {
    callbacksRef.current = {
      handleUnlinkTopic,
      handleOpenAddQuestion,
      handleOpenEditQuestion,
      handleDeleteQuestion,
    };
  });

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
          onUnlinkTopic={(_quizId, _quizTitle, topicId) => callbacksRef.current?.handleUnlinkTopic(topicId)}
          onAddQuestion={() => callbacksRef.current?.handleOpenAddQuestion()}
          onEditQuestion={(q) => callbacksRef.current?.handleOpenEditQuestion(q)}
          onDeleteQuestion={(questionId) => callbacksRef.current?.handleDeleteQuestion(questionId)}
        />
      ),
    });
  }, [selectedQuizId, activeQuizDetail, activeQuizLoading, quizzes, panel]);

  const isAllCurrentPageSelected = paginated.length > 0 && paginated.every(q => selectedQuizIds.includes(q.id));

  return (
    <div className="flex flex-col gap-6 py-4 w-full relative">
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title="Quizzes"
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
            {quizzes.length}
          </Badge>
        }
        description="Manage quizzes, merge multiple quizzes, link topics, and inspect questions."
        actions={
          <div className="flex items-center gap-2">
            {selectedQuizIds.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMergeDialog}
                className="gap-1.5 font-semibold text-xs h-9 px-3.5 border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 shadow-xs whitespace-nowrap shrink-0"
              >
                <GitMerge className="h-3.5 w-3.5 shrink-0" />
                <span>Merge Selected ({selectedQuizIds.length})</span>
              </Button>
            )}

            <Button variant="primary" size="sm" className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" onClick={openGenerateDialog}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Quiz</span>
            </Button>
            {quizzes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 font-semibold text-xs h-9">
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        }
      />

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
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
                  <th scope="col" className="py-3.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      title={isAllCurrentPageSelected ? "Deselect page" : "Select all on page"}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0.5"
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="py-3.5 px-3 font-bold w-14 text-center">Order</th>
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
                  <QuizRow
                    key={item.id}
                    quiz={item}
                    isSelected={selectedQuizIds.includes(item.id)}
                    onToggleSelect={handleToggleSelect}
                    onSelectQuiz={(id) => router.push(`/admin/manage/quizzes/${id}/questions`)}
                    onOpenLinkDialog={openLinkDialog}
                    onOpenEditDialog={openEditDialog}
                    onDeleteQuiz={handleDeleteQuiz}
                    onAppendQuestions={handleOpenAppendDialog}
                  />
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

      {/* Floating Bottom Multi-Select Merge Action Bar */}
      <AnimatePresence>
        {selectedQuizIds.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 40, scale: 0.92, x: "-50%" }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 420,
              mass: 0.8,
            }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 z-40 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-foreground text-background shadow-2xl border border-border/40 max-w-[calc(100vw-1.5rem)] sm:max-w-max select-none"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <motion.span
                key={selectedQuizIds.length}
                initial={{ scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="h-6 w-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
              >
                {selectedQuizIds.length}
              </motion.span>
              <span className="text-xs font-semibold whitespace-nowrap">
                <span className="hidden sm:inline">quizzes </span>selected
              </span>
            </div>

            <div className="h-4 w-px bg-background/20 shrink-0" />

            <Button
              size="sm"
              onClick={handleOpenMergeDialog}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold h-8 px-3 sm:px-4 shrink-0 whitespace-nowrap active:scale-95 transition-transform"
            >
              <GitMerge className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Merge into 1 Quiz</span>
            </Button>

            <button
              onClick={() => {
                soundEffects.playClearSound();
                setSelectedQuizIds([]);
              }}
              className="text-background/70 hover:text-background text-xs flex items-center gap-1 shrink-0 cursor-pointer p-1 rounded-md transition-colors whitespace-nowrap active:scale-90"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
export default QuizManager;
