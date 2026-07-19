"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import NoData from "@/components/feedback/NoData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useDialog } from "@/components/providers/OverlayProvider";
import { Pagination } from "@/components/data-display/Pagination";
import { SearchFilterBar } from "@/components/data-display/SearchFilterBar";
import { PageHeader } from "@/components/data-display/PageHeader";
import { QuestionCard } from "@/components/data-display/QuestionCard";
import { QuestionEditorBody, type QuestionEditorForm } from "@/components/data-display/QuestionEditorBody";

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



interface QuestionDialogBodyProps {
  initialForm: QuestionEditorForm;
  quizzes: QuizRef[];
  onSave: (form: QuestionEditorForm) => Promise<void>;
  loading: boolean;
}

function QuestionDialogBody({ initialForm, quizzes, onSave, loading }: QuestionDialogBodyProps) {
  const [form, setForm] = useState<QuestionEditorForm>(initialForm);
  const dialog = useDialog();

  const handleSave = async () => {
    await onSave(form);
    dialog.close();
  };

  return (
    <div className="flex flex-col gap-4 mt-3">
      <QuestionEditorBody
        form={form}
        onChange={setForm}
        onOptionChange={(idx, val) => {
          setForm(prev => {
            const newOpts = [...prev.options];
            newOpts[idx] = val;
            let newCorrect = prev.correctAnswer;
            if (prev.correctAnswer === prev.options[idx]) {
              newCorrect = val;
            }
            return { ...prev, options: newOpts, correctAnswer: newCorrect };
          });
        }}
        quizzes={quizzes.map(quiz => ({ id: quiz.id, title: quiz.title }))}
        onQuizChange={(quizId) => setForm(prev => ({ ...prev, quizId }))}
        descriptionRequired={true}
        loading={loading}
      />
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!form.quizId || !form.text || form.options.some(o => !o.trim()) || !form.correctAnswer || loading}
          className="gap-1.5"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>Save</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * AdminQuestionsManager — administrative management panel for individual questions.
 * Supports manual create, edit, delete, searching, and filtering by quiz.
 */
export function AdminQuestionsManager({ questions: initial, quizzes }: AdminQuestionsManagerProps) {
  const [questions, setQuestions] = useState<Question[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dialog = useDialog();

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    dialog.confirm({ title, description, onConfirm });

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
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setError(null);
    dialog.open({
      title: "Add Question",
      body: (
        <QuestionDialogBody
          initialForm={{ id: "", quizId: quizzes[0]?.id || "", text: "", options: ["", "", "", ""], correctAnswer: "", hint: "", description: "" }}
          quizzes={quizzes}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  const handleOpenEdit = (q: Question) => {
    setError(null);
    dialog.open({
      title: "Edit Question",
      body: (
        <QuestionDialogBody
          initialForm={{ id: q.id, quizId: q.quizId || "", text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, hint: q.hint || "", description: q.description || "" }}
          quizzes={quizzes}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  const handleSaveQuestion = async (form: QuestionEditorForm) => {
    setLoading(true);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/questions/${form.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: form.quizId,
      text: form.text,
      options: form.options,
      correctAnswer: form.correctAnswer,
      hint: form.hint,
      description: form.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.error) {
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
      <PageHeader
        title="Questions Directory"
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
            {questions.length}
          </Badge>
        }
        description="Inspect, search, edit, or manually compose questions for any quiz."
        actions={
          <Button variant="primary" size="sm" className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add Question</span>
          </Button>
        }
      />

      {/* Toolbar Search & Filter Box */}
      {questions.length > 0 && (
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          searchPlaceholder="Search by question text or quiz..."
          filterValue={quizFilter}
          onFilterChange={v => { setQuizFilter(v); setCurrentPage(1); }}
          filterOptions={quizzes.map(quiz => ({ value: quiz.id, label: quiz.title }))}
          filterPlaceholder="All Quizzes"
        />
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
              <div key={q.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap select-none">
                      <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-2 py-0.5 animate-none">
                         Quiz: {q.quiz?.title || "Unassigned"}
                      </Badge>
                       {q.topic && (
                         <Badge variant="secondary" className="text-[10px] px-2 py-0.5 animate-none">
                           Topic: {q.topic.title}
                         </Badge>
                       )}
                    </div>
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

                <QuestionCard
                  question={q}
                  index={(currentPage - 1) * pageSize + idx}
                  optionVariant="badge"
                />
              </div>
            ))}
          </div>


          {/* Pagination Footer */}
          <Pagination
            variant="bare"
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageSizeChange={v => { setPageSize(v); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

    </div>
  );
}
export default AdminQuestionsManager;
