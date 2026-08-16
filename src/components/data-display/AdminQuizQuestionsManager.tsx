"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Sparkles } from "lucide-react";

import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useDialog } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { PageHeader } from "@/components/data-display/PageHeader";
import { QuestionCard } from "@/components/data-display/QuestionCard";
import { QuestionDialogBody, type QuestionForm } from "@/components/data-display/TaxonomyDialogBodies";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";

interface Question {
  id: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
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
 * Supports manual question creation and AI-powered question appending.
 */
export function AdminQuizQuestionsManager({ quiz: initialQuiz }: AdminQuizQuestionsManagerProps) {
  const router = useRouter();
  const toast = useToast();
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

  const handleSaveQuestion = async (form: QuestionForm) => {
    setLoading(true);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/questions/${form.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: quiz.id,
      text: form.text,
      imageUrl: form.imageUrl,
      invertInDark: form.invertInDark,
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
        await refreshQuiz();
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

  const handleOpenAdd = () => {
    setError(null);
    dialog.open({
      title: "Add Question",
      body: (
        <QuestionDialogBody
          initialForm={{
            id: "",
            text: "",
            imageUrl: "",
            invertInDark: true,
            options: ["", "", "", ""],
            correctAnswer: "",
            hint: "",
            description: ""
          }}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  const handleOpenAiAppend = () => {
    setError(null);
    dialog.open({
      title: `AI Generate Questions — ${quiz.title}`,
      body: (
        <GenerateQuizForm
          targetQuizId={quiz.id}
          targetQuizTitle={quiz.title}
          onSuccess={async () => {
            dialog.close();
            await refreshQuiz();
            toast.addToast({
              type: "success",
              message: `Appended questions to "${quiz.title}"!`,
            });
          }}
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
          initialForm={{
            id: q.id,
            text: q.text,
            imageUrl: q.imageUrl || "",
            invertInDark: q.invertInDark ?? true,
            options: [...q.options],
            correctAnswer: q.correctAnswer,
            hint: q.hint || "",
            description: q.description || ""
          }}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  const handleDelete = (id: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Are you sure you want to delete "${text}"? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            await refreshQuiz();
            toast.addToast({ type: "success", message: "Question deleted" });
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
      <PageHeader
        title={`${quiz.title} Questions`}
        badge={
          <Badge variant={difficultyColor(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 select-none animate-none">
            {quiz.difficulty}
          </Badge>
        }
        description="Compose, modify, or remove questions linked to this quiz."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 px-4 font-semibold text-xs gap-1.5 shadow-xs"
              onClick={handleOpenAiAppend}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI Generate More</span>
            </Button>
            <Button
              variant="primary"
              className="h-9 px-4 font-semibold text-xs gap-1.5 shadow-xs"
              onClick={handleOpenAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Question</span>
            </Button>
          </div>
        }
        titleClassName="text-2xl"
      />

      {/* Questions list */}
      {quiz.questions.length === 0 ? (
        <NoData 
          title="No Questions Yet" 
          description="This quiz has no questions. Add a question manually or use AI to generate questions from text/PDF." 
          icon="book"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAiAppend}>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>AI Generate Questions</span>
              </Button>
              <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </Button>
            </div>
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
