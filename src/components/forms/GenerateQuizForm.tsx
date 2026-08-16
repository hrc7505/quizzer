"use client";

import { useState, useRef } from "react";
import { FileText, Type, Sparkles, Info } from "lucide-react";

import { GenerateQuizResponse, GenerateQuizPayload } from "@/components/forms/interfaces/GenerateQuizForm.interface";
import { QuizService } from "@/lib/services/quiz.service";
import { getAiErrorMeta, type AiErrorMeta } from "@/lib/gemini";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { ModelCapabilityError } from "@/components/ui/ModelCapabilityError";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

interface GenerateQuizFormProps {
  /** Called after a successful generation — parent can close dialog / refresh state. */
  onSuccess?: (result: GenerateQuizResponse) => void;
  initialTopicId?: string;
}

/**
 * GenerateQuizForm — embeddable form that generates a quiz via Gemini AI.
 * The quiz title is used only as context for AI question generation.
 * After creation the quiz is standalone; admin links it to subtopics via QuizManager.
 */
export function GenerateQuizForm({ onSuccess, initialTopicId }: GenerateQuizFormProps = {}) {
  const [mode, setMode] = useState<"title" | "text" | "pdf">("title");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tablistRef = useRef<HTMLDivElement>(null);

  const setTabRef = (index: number) => (el: HTMLButtonElement | null) => {
    tabRefs.current[index] = el;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs: ("title" | "text" | "pdf")[] = ["title", "text", "pdf"];
    const currentIndex = tabs.indexOf(mode);
    let newIndex = currentIndex;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (newIndex !== currentIndex) {
      setMode(tabs[newIndex]);
      setError(null);
      setResult(null);
      tabRefs.current[newIndex]?.focus();
    }
  };

  const [quizTitle, setQuizTitle] = useState("");
  const [topicText, setTopicText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorMeta, setErrorMeta] = useState<AiErrorMeta | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a valid PDF file.");
        return;
      }
      setFile(f);
      setError(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (dropped.type !== "application/pdf" && !dropped.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a valid PDF file.");
      } else {
        setFile(dropped);
        setError(null);
      }
    }
  };

  const isFormValid = () => {
    if (!quizTitle) return false;
    if (mode === "text" && !topicText) return false;
    if (mode === "pdf" && !file) return false;
    return true;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: GenerateQuizPayload = {
        mode,
        topicTitle: quizTitle,
        existingTopicId: initialTopicId || undefined,
        difficulty,
        topicText: mode === "text" ? topicText : undefined,
        file: mode === "pdf" ? file : undefined,
      };

      const data = await QuizService.generateQuiz(payload as unknown as Record<string, unknown>);
      if (data.error) {
        setError(data.error);
        setErrorMeta(data.errorMeta || null);
        return;
      }
      setResult(data);
      setQuizTitle("");
      setTopicText("");
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      onSuccess?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(message || "An unexpected error occurred while communicating with Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  const renderErrorAlert = () => {
    if (!error) return null;
    const meta = errorMeta || getAiErrorMeta(error);
    if (meta.icon === "image-off") {
      return <ModelCapabilityError message={error} />;
    }
    return (
      <Alert variant={meta.variant} title="Error">
        {error}
      </Alert>
    );
  };

  const tabs = [
    { id: "title", label: "From Title Only", icon: Sparkles },
    { id: "text", label: "From Text", icon: Type },
    { id: "pdf", label: "From PDF", icon: FileText },
  ] as const;

  return (
    <form onSubmit={handleGenerate} className="flex flex-col gap-5 w-full">
      {renderErrorAlert()}

      {result && (
        <Alert variant="success" title="Success">
          {result.isBatched
            ? `Created ${result.batchesCreated} batch(es) in the queue for ${result.totalQuestions} questions! Generation has started in the background.`
            : `Generated ${result.totalQuestions} questions across ${result.quizzesCreated} quiz${result.quizzesCreated > 1 ? "zes" : ""}!`}
        </Alert>
      )}

      {/* Model capability banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
          <Info className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">Text-only model</span>
          <span className="text-xs text-muted-foreground leading-relaxed">
            This AI model processes text only. It cannot read images, diagrams, or scanned pages. Use text or PDF inputs for best results.
          </span>
        </div>
      </div>

      {/* Mode tabs */}
      <div 
        ref={tablistRef} 
        role="tablist" 
        aria-label="Generation mode" 
        className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/60 p-1"
        onKeyDown={handleTabKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = mode === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={setTabRef(["title", "text", "pdf"].indexOf(tab.id))}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setMode(tab.id);
                setError(null);
                setResult(null);
              }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer select-none text-center",
                isActive 
                  ? "bg-surface text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quiz Title — always shown; used as AI context prompt */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs sm:text-sm font-semibold text-foreground/90">Quiz Title <span className="text-danger">*</span></label>
        <Input
          placeholder="e.g. History of Rome"
          value={quizTitle}
          onChange={e => setQuizTitle(e.target.value)}
          disabled={loading}
          className="h-10 text-sm"
          required
        />
        <span className="text-[11px] sm:text-xs text-muted-foreground/70 leading-tight">
          The title is used by AI to generate relevant questions. The quiz will be created standalone or linked under your selected topic.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs sm:text-sm font-semibold text-foreground/90">Difficulty Level <span className="text-danger">*</span></label>
        <Select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)} 
          disabled={loading}
          className="h-10 text-sm"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>
      </div>

      {mode === "text" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground/90">Content (Text) <span className="text-danger">*</span></label>
          <Textarea
            placeholder="Paste questions or study text here..."
            value={topicText}
            onChange={e => setTopicText(e.target.value)}
            disabled={loading}
            rows={6}
            className="text-xs sm:text-sm max-h-[30vh] sm:max-h-[40vh] resize-y"
            required
          />
          <span className="text-[11px] sm:text-xs text-muted-foreground/70">
            Paste any amount of questions — they will be automatically batched into 30-question quizzes.
          </span>
        </div>
      )}

      {mode === "pdf" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground/90">Upload PDF <span className="text-danger">*</span></label>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload PDF file"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-dashed border-border p-4 sm:p-6 text-center transition-all duration-150 cursor-pointer select-none",
              isDragging ? "border-primary bg-primary/[0.04]" : "hover:border-primary/40 hover:bg-surface-hover/50",
              file && "border-solid border-success/30 bg-success/5"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={loading} ref={fileInputRef} className="hidden" />
            <div className={cn(
              "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-colors duration-150",
              file ? "bg-success/10 text-success" : isDragging ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground break-all px-2">
              {file ? file.name : isDragging ? "Drop PDF here" : "Drag & drop a PDF, or tap to browse"}
            </span>
            {!file && !isDragging && (
              <span className="text-[11px] sm:text-xs text-muted-foreground/70">Supports .pdf files only</span>
            )}
            {file && (
              <span className="text-[11px] sm:text-xs text-success font-medium">PDF ready to process</span>
            )}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-card pt-2 pb-1 z-10">
        <Button 
          variant="primary" 
          type="submit" 
          disabled={loading || !isFormValid()} 
          className="h-11 w-full font-semibold gap-2 shadow-sm text-sm"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="text-primary-foreground" /> 
              <span>Generating Quizzes…</span>
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </div>
    </form>
  );
}
