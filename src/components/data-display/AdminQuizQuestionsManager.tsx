"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Sparkles, Layers, Wand2, Loader2, Languages } from "lucide-react";

import { difficultyColor } from "@/lib/format";
import { cn } from "@/utils/cn";
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
import { DuplicateQuestionsDialogBody } from "@/components/data-display/DuplicateQuestionsDialogBody";
import { TranslateQuizDialogBody } from "@/components/data-display/TranslateQuizDialogBody";
import { soundEffects } from "@/lib/services/sound-effects.service";

interface Question {
  id: string;
  sourceQuestionId?: string | null;
  language?: string;
  text: string;
  imageUrl?: string | null;
  invertInDark?: boolean;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
  createdAt?: Date | string;
}

interface QuizDetail {
  id: string;
  title: string;
  language?: string;
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
 * Supports manual question creation, duplicate detection & cleanup, and AI language proofreading.
 */
export function AdminQuizQuestionsManager({ quiz: initialQuiz }: AdminQuizQuestionsManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const [quiz, setQuiz] = useState<QuizDetail>(initialQuiz);
  const [loading, setLoading] = useState(false);
  const [proofreadingAll, setProofreadingAll] = useState(false);
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
      language: form.language || activeLangTab,
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
      if (data.error) {
        setError(data.error);
      } else {
        toast.addToast({
          type: "success",
          message: isEdit ? "Question updated successfully" : "Question created successfully"
        });
        await refreshQuiz();
      }
    } catch {
      setError("Failed to save question");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setError(null);
    dialog.open({
      title: `Add ${currentLangLabel} Question`,
      body: (
        <QuestionDialogBody
          initialForm={{
            id: "",
            language: activeLangTab,
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
            language: q.language || activeLangTab,
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

  const handleOpenDuplicates = () => {
    dialog.open({
      title: `Find Duplicates — ${quiz.title}`,
      body: (
        <DuplicateQuestionsDialogBody
          quizId={quiz.id}
          quizTitle={quiz.title}
          onClose={() => dialog.close()}
          onSuccess={refreshQuiz}
        />
      ),
    });
  };

  const handleOpenTranslateDialog = () => {
    dialog.open({
      title: `Localize Quiz — ${quiz.title}`,
      body: (
        <TranslateQuizDialogBody
          quizId={quiz.id}
          quizTitle={quiz.title}
          currentLanguage={quiz.language || "en"}
          questionCount={quiz.questions.length}
          onClose={() => dialog.close()}
          onSuccess={async (res) => {
            toast.addToast({
              type: "success",
              message:
                res.mode === "clone"
                  ? `Created companion quiz in ${res.language.toUpperCase()}`
                  : `Translated quiz to ${res.language.toUpperCase()}`,
            });
            await refreshQuiz();
          }}
        />
      ),
    });
  };

  const getTime = (q: Question) => {
    const d = q.createdAt;
    return d ? new Date(d).getTime() : 0;
  };

  // 1. Base canonical English questions ordered by creation time
  const enQuestions = quiz.questions
    .filter(
      (q) =>
        q.language === "en" ||
        (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text))
    )
    .sort((a, b) => getTime(a) - getTime(b));

  // 2. Build Gujarati track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const guMap = new Map<string, Question>();
  const guUnmapped: Question[] = [];
  for (const q of quiz.questions) {
    if (q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text))) {
      if (q.sourceQuestionId) {
        guMap.set(q.sourceQuestionId, q);
      } else {
        guUnmapped.push(q);
      }
    }
  }

  const guQuestions =
    enQuestions.length > 0 && (guMap.size > 0 || guUnmapped.length > 0)
      ? enQuestions.map((enQ, idx) => guMap.get(enQ.id) || guUnmapped[idx] || enQ)
      : quiz.questions
          .filter((q) => q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text)))
          .sort((a, b) => getTime(a) - getTime(b));

  // 3. Build Hindi track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const hiMap = new Map<string, Question>();
  const hiUnmapped: Question[] = [];
  for (const q of quiz.questions) {
    if (q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text))) {
      if (q.sourceQuestionId) {
        hiMap.set(q.sourceQuestionId, q);
      } else {
        hiUnmapped.push(q);
      }
    }
  }

  const hiQuestions =
    enQuestions.length > 0 && (hiMap.size > 0 || hiUnmapped.length > 0)
      ? enQuestions.map((enQ, idx) => hiMap.get(enQ.id) || hiUnmapped[idx] || enQ)
      : quiz.questions
          .filter((q) => q.language === "hi")
          .sort((a, b) => getTime(a) - getTime(b));

  const [activeLangTab, setActiveLangTab] = useState<string>(() => {
    if (enQuestions.length > 0) return "en";
    if (guQuestions.length > 0) return "gu";
    if (hiQuestions.length > 0) return "hi";
    return "en";
  });

  const displayedQuestions =
    activeLangTab === "gu"
      ? guQuestions
      : activeLangTab === "hi"
      ? hiQuestions
      : enQuestions;

  const currentLangLabel =
    activeLangTab === "gu" ? "Gujarati" : activeLangTab === "hi" ? "Hindi" : "English";

  const handleAiProofreadQuiz = () => {
    if (displayedQuestions.length === 0) {
      toast.addToast({ type: "warning", message: `This quiz has no ${currentLangLabel} questions to proofread.` });
      return;
    }

    dialog.confirm({
      title: `AI Proofread & Fix ${currentLangLabel} Language`,
      description: `AI will proofread all ${displayedQuestions.length} ${currentLangLabel} questions in "${quiz.title}", repairing grammar, typos, OCR artifacts, and script rendering while strictly preserving authentic exam terminology.`,
      okText: "Start Proofreading",
      onConfirm: async () => {
        setProofreadingAll(true);
        try {
          const res = await fetch("/api/admin/questions/fix-language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizId: quiz.id, language: activeLangTab }),
          });
          const data = await res.json();
          if (data.error) {
            toast.addToast({ type: "error", message: data.error });
          } else {
            soundEffects.playCorrectSound();
            toast.addToast({
              type: "success",
              message: data.message || `Successfully proofread ${data.updatedCount} questions.`,
            });
            await refreshQuiz();
          }
        } catch (err) {
          console.error(err);
          toast.addToast({ type: "error", message: "Failed to proofread quiz questions." });
        } finally {
          setProofreadingAll(false);
        }
      },
    });
  };

  const proofreadBtnLabel = proofreadingAll
    ? "Proofreading…"
    : activeLangTab === "gu"
    ? "AI Proofread (Gujarati)"
    : activeLangTab === "hi"
    ? "AI Proofread (Hindi)"
    : "AI Proofread & Fix";

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between gap-3 select-none flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-7 px-2.5 -ml-1 gap-1 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-border/50 hover:bg-surface-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>
          <span className="text-border">/</span>
          <button
            type="button"
            onClick={() => router.push("/admin/manage/quizzes")}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Manage Quizzes
          </button>
          <span className="text-border">/</span>
          <span className="text-foreground font-bold truncate max-w-xs">{quiz.title}</span>
          <span className="text-border">/</span>
          <span className="text-muted-foreground">Questions</span>
        </div>
      </div>

      {/* Hero Header & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
              {quiz.title}
            </h1>
            <div className="flex items-center gap-1.5">
              {guQuestions.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
                  🇮🇳 GU
                </span>
              )}
              {hiQuestions.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 select-none">
                  🇮🇳 HI
                </span>
              )}
              {enQuestions.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 select-none">
                  🇺🇸 EN
                </span>
              )}
              <Badge variant={difficultyColor(quiz.difficulty)} className="capitalize font-bold text-[11px] px-2.5 py-0.5 select-none animate-none rounded-md">
                {quiz.difficulty}
              </Badge>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Compose, modify, or translate questions across language tracks for this quiz.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 font-semibold text-xs gap-1.5 shadow-2xs text-muted-foreground hover:text-foreground rounded-xl border-border/70"
            onClick={handleOpenDuplicates}
            title="Scan and remove duplicate questions"
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Find</span> Duplicates
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 rounded-xl"
            onClick={handleOpenTranslateDialog}
            title="Generate a Gujarati or Hindi translation for this quiz"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-500" />
            <span>Localize with AI</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs rounded-xl text-foreground hover:bg-surface-hover"
            onClick={handleOpenAiAppend}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI Generate More</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="h-9 px-4 font-semibold text-xs gap-1.5 shadow-xs rounded-xl"
            onClick={handleOpenAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* Language Switcher Tabs & Contextual Proofread Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-surface/50 p-1.5 rounded-2xl border border-border/70">
        <div className="flex items-center gap-1.5 select-none flex-wrap">
          <button
            type="button"
            onClick={() => setActiveLangTab("en")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeLangTab === "en"
                ? "bg-card shadow-xs text-foreground ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🇺🇸</span>
            <span>English</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                enQuestions.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {enQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLangTab("gu")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeLangTab === "gu"
                ? "bg-card shadow-xs text-foreground ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🇮🇳</span>
            <span>ગુજરાતી (Gujarati)</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                guQuestions.length > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {guQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLangTab("hi")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeLangTab === "hi"
                ? "bg-card shadow-xs text-foreground ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🇮🇳</span>
            <span>हिन्दी (Hindi)</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                hiQuestions.length > 0
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {hiQuestions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          {displayedQuestions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={proofreadingAll}
              className="h-8 px-3 font-semibold text-xs gap-1.5 shadow-2xs text-primary border-primary/30 hover:bg-primary/10 rounded-xl"
              onClick={handleAiProofreadQuiz}
              title={`Fix ${currentLangLabel} spelling, grammar, and typos`}
            >
              {proofreadingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3 text-primary" />
              )}
              <span>{proofreadBtnLabel}</span>
            </Button>
          )}

          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Showing {displayedQuestions.length} {currentLangLabel} questions
          </span>
        </div>
      </div>

      {/* Questions list */}
      {displayedQuestions.length === 0 ? (
        <NoData 
          title={`No ${currentLangLabel} Questions`} 
          description={`Translate the quiz questions into ${currentLangLabel} using one-click AI localization.`} 
          icon="book"
          action={
            <div className="flex items-center gap-2">
              <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenTranslateDialog}>
                <Languages className="h-3.5 w-3.5" />
                <span>Localize with AI</span>
              </Button>
              <Button variant="outline" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {displayedQuestions.map((q, idx) => (
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
