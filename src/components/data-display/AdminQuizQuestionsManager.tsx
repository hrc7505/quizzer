"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useDialog } from "@/components/providers/OverlayProvider";
import { QuestionCard } from "@/components/data-display/QuestionCard";
import { QuestionEditorBody } from "@/components/data-display/QuestionEditorBody";
import { cn } from "@/utils/cn";

interface QuestionForm {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

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
  const dialog = useDialog();

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    dialog.confirm({ title, description, onConfirm });

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

  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  const handleOpenAdd = () => {
    setQuestionForm({ id: "", text: "", options: ["", "", "", ""], correctAnswer: "", hint: "", description: "" });
    setError(null);
    dialog.open({
      title: "Add Question",
      body: <QuestionEditorBody form={questionForm} onChange={setQuestionForm} onOptionChange={handleOptionChange} loading={loading} />,
      onOk: () => handleSaveQuestion(),
      okText: "Save",
    });
  };

  const handleOpenEdit = (q: Question) => {
    setQuestionForm({ id: q.id, text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, hint: q.hint || "", description: q.description || "" });
    setError(null);
    dialog.open({
      title: "Edit Question",
      body: <QuestionEditorBody form={questionForm} onChange={setQuestionForm} onOptionChange={handleOptionChange} loading={loading} />,
      onOk: () => handleSaveQuestion(),
      okText: "Save",
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
            <Badge variant={difficultyColor(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 select-none">
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
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              optionVariant="badge"
              onEdit={handleOpenEdit}
              onDelete={(item) => handleDelete(item.id, item.text)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
export default AdminQuizQuestionsManager;
