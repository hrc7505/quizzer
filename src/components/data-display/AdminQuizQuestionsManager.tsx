"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Sparkles, Layers, Wand2, Loader2, Languages, FileDown } from "lucide-react";

import { generateQuizPDF } from "@/lib/pdf-generator";
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
import { Pagination } from "@/components/data-display/Pagination";
import { QuestionDialogBody, type QuestionForm } from "@/components/data-display/TaxonomyDialogBodies";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { DuplicateQuestionsDialogBody } from "@/components/data-display/DuplicateQuestionsDialogBody";
import { TranslateQuizDialogBody } from "@/components/data-display/TranslateQuizDialogBody";
import { ProofreadQuizDialogBody } from "@/components/data-display/ProofreadQuizDialogBody";
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

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const runDownloadPdf = async (mode: "current" | "en" | "gu" | "hi") => {
    const list =
      mode === "gu"
        ? guQuestions
        : mode === "hi"
          ? hiQuestions
          : mode === "en"
            ? enQuestions
            : displayedQuestions;

    const label =
      mode === "gu"
        ? "Gujarati"
        : mode === "hi"
          ? "Hindi"
          : mode === "en"
            ? "English"
            : currentLangLabel;

    if (list.length === 0) {
      toast.addToast({ type: "warning", message: `No ${label} questions available to generate PDF.` });
      return;
    }

    setDownloadingPdf(true);
    try {
      await generateQuizPDF({
        title: `${quiz.title} (${label})`,
        language: mode === "current" ? activeLangTab : mode,
        questions: list.map((q) => ({
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options,
          correctAnswer: q.correctAnswer,
          description: q.description,
          hint: q.hint,
          language: q.language || (mode === "current" ? activeLangTab : mode),
        })),
      });
      toast.addToast({ type: "success", message: `Generated ${label} PDF Booklet successfully!` });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.addToast({ type: "error", message: "Failed to generate PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const runDownloadBilingualPdf = async (targetLang: "gu" | "hi") => {
    const targetMap = targetLang === "gu" ? guMap : hiMap;
    const targetLabel = targetLang === "gu" ? "Gujarati" : "Hindi";

    if (enQuestions.length === 0) {
      toast.addToast({ type: "warning", message: "English canonical questions required for bilingual booklet." });
      return;
    }

    setDownloadingPdf(true);
    try {
      await generateQuizPDF({
        title: `${quiz.title} (English & ${targetLabel})`,
        language: "bilingual",
        isBilingual: true,
        questions: enQuestions.map((enQ) => {
          const companion = targetMap.get(enQ.id);
          return {
            text: enQ.text,
            secondaryText: companion?.text || null,
            secondaryLanguage: targetLang,
            imageUrl: enQ.imageUrl || companion?.imageUrl,
            options: enQ.options,
            secondaryOptions: companion?.options || [],
            correctAnswer: enQ.correctAnswer,
            secondaryCorrectAnswer: companion?.correctAnswer || null,
            description: enQ.description,
            secondaryDescription: companion?.description || null,
            hint: enQ.hint,
            language: "en",
          };
        }),
      });
      toast.addToast({ type: "success", message: `Generated Bilingual (English + ${targetLabel}) PDF!` });
    } catch (err) {
      console.error("Bilingual PDF generation failed:", err);
      toast.addToast({ type: "error", message: "Failed to generate Bilingual PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenDownloadPdf = () => {
    const hasGujarati = guQuestions.length > 0;
    const hasHindi = hiQuestions.length > 0;

    if (!hasGujarati && !hasHindi) {
      runDownloadPdf("current");
      return;
    }

    dialog.open({
      title: `Download PDF Booklet — ${quiz.title}`,
      body: (
        <div className="flex flex-col gap-4 py-2">
          <p className="text-xs text-muted-foreground">
            Select the desired format for your printable exam paper and answer key booklet:
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                dialog.close();
                runDownloadPdf("current");
              }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  📄 {currentLangLabel} Only ({displayedQuestions.length} Questions)
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Standard exam booklet in {currentLangLabel} language.
                </span>
              </div>
              <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>

            {hasGujarati && (
              <button
                type="button"
                onClick={() => {
                  dialog.close();
                  runDownloadBilingualPdf("gu");
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    🌐 Bilingual Booklet: English + ગુજરાતી (Gujarati)
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Shows English questions with paired Gujarati translation underneath and bilingual answer key.
                  </span>
                </div>
                <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
              </button>
            )}

            {hasHindi && (
              <button
                type="button"
                onClick={() => {
                  dialog.close();
                  runDownloadBilingualPdf("hi");
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    🌐 Bilingual Booklet: English + हिन्दी (Hindi)
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Shows English questions with paired Hindi translation underneath and bilingual answer key.
                  </span>
                </div>
                <FileDown className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors shrink-0" />
              </button>
            )}
          </div>
        </div>
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

  const rawGuList = quiz.questions.filter(
    (q) => q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text))
  );
  const rawHiList = quiz.questions.filter(
    (q) => q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text))
  );

  // 2. Build Gujarati track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const guMap = new Map<string, Question>();
  const guUnmapped: Question[] = [];
  for (const q of rawGuList) {
    if (q.sourceQuestionId) {
      guMap.set(q.sourceQuestionId, q);
    } else {
      guUnmapped.push(q);
    }
  }

  const guQuestions: Question[] =
    enQuestions.length > 0 && guMap.size > 0
      ? enQuestions.map((enQ) => guMap.get(enQ.id)).filter((q): q is Question => !!q).concat(guUnmapped)
      : rawGuList.sort((a, b) => getTime(a) - getTime(b));

  // 3. Build Hindi track strictly paired by sourceQuestionId to match English sequence 1-to-1
  const hiMap = new Map<string, Question>();
  const hiUnmapped: Question[] = [];
  for (const q of rawHiList) {
    if (q.sourceQuestionId) {
      hiMap.set(q.sourceQuestionId, q);
    } else {
      hiUnmapped.push(q);
    }
  }

  const hiQuestions: Question[] =
    enQuestions.length > 0 && hiMap.size > 0
      ? enQuestions.map((enQ) => hiMap.get(enQ.id)).filter((q): q is Question => !!q).concat(hiUnmapped)
      : rawHiList.sort((a, b) => getTime(a) - getTime(b));

  const [activeLangTab, setActiveLangTab] = useState<string>(() => {
    if (enQuestions.length > 0) return "en";
    if (rawGuList.length > 0) return "gu";
    if (rawHiList.length > 0) return "hi";
    return "en";
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const displayedQuestions =
    activeLangTab === "gu"
      ? guQuestions
      : activeLangTab === "hi"
        ? hiQuestions
        : enQuestions;

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedQuestions.slice(startIndex, startIndex + pageSize);
  }, [displayedQuestions, currentPage, pageSize]);

  const currentLangLabel =
    activeLangTab === "gu" ? "Gujarati" : activeLangTab === "hi" ? "Hindi" : "English";

  const handleAiProofreadQuiz = () => {
    if (displayedQuestions.length === 0) {
      toast.addToast({ type: "warning", message: `This quiz has no ${currentLangLabel} questions to proofread.` });
      return;
    }

    dialog.open({
      title: `AI Proofread — ${quiz.title}`,
      body: (
        <ProofreadQuizDialogBody
          quizId={quiz.id}
          quizTitle={quiz.title}
          language={activeLangTab}
          questionCount={displayedQuestions.length}
          onSuccess={async () => {
            await refreshQuiz();
            toast.addToast({
              type: "success",
              message: `Successfully proofread ${displayedQuestions.length} ${currentLangLabel} questions!`,
            });
          }}
          onClose={() => dialog.close()}
        />
      ),
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
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs text-foreground bg-surface hover:bg-surface-hover border-border/80 hover:border-border rounded-xl transition-all"
            onClick={handleOpenDuplicates}
            title="Scan and remove duplicate questions"
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" />
            <span>Find Duplicates</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs text-foreground bg-surface hover:bg-surface-hover border-border/80 hover:border-border rounded-xl transition-all"
            onClick={handleOpenTranslateDialog}
            title="Generate a Gujarati or Hindi translation for this quiz"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Localize with AI</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs text-foreground bg-surface hover:bg-surface-hover border-border/80 hover:border-border rounded-xl transition-all"
            onClick={handleOpenAiAppend}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI Generate More</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 font-semibold text-xs gap-1.5 shadow-2xs text-foreground bg-surface hover:bg-surface-hover border-border/80 hover:border-border rounded-xl transition-all"
            onClick={handleOpenDownloadPdf}
            disabled={downloadingPdf}
            title="Download printable exam paper with answer key"
          >
            {downloadingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <FileDown className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
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
            onClick={() => {
              setActiveLangTab("en");
              setCurrentPage(1);
            }}
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
            onClick={() => {
              setActiveLangTab("gu");
              setCurrentPage(1);
            }}
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
            onClick={() => {
              setActiveLangTab("hi");
              setCurrentPage(1);
            }}
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
          <div className="flex flex-col gap-6">
            {paginatedQuestions.map((q, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx;
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={globalIndex}
                  optionVariant="badge"
                  onEdit={handleOpenEdit}
                  onDelete={(item) => handleDelete(item.id, item.text)}
                />
              );
            })}
          </div>

          {displayedQuestions.length > pageSize && (
            <Pagination
              totalItems={displayedQuestions.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
              pageSizeOptions={[10, 25, 50, 100]}
              variant="bare"
            />
          )}
        </div>
      )}

    </div>
  );
}
export default AdminQuizQuestionsManager;
