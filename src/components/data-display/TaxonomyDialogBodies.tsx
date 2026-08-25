"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useDialog } from "@/components/providers/OverlayProvider";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { cn } from "@/utils/cn";

export interface ExamForm {
  id: string;
  title: string;
  description: string;
}

export interface TopicForm {
  id: string;
  title: string;
  description: string;
  examId: string;
  parentId: string;
}

import { ImageUploader } from "@/components/forms/ImageUploader";
import { Sparkles, Loader2 } from "lucide-react";

export interface QuestionForm {
  id: string;
  language?: string;
  text: string;
  imageUrl?: string;
  invertInDark?: boolean;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

export interface ExamDialogBodyProps {
  initialForm: ExamForm;
  onSave: (form: ExamForm) => Promise<void>;
  loading: boolean;
}

export function ExamDialogBody({ initialForm, onSave, loading }: ExamDialogBodyProps) {
  const [form, setForm] = React.useState<ExamForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const dialog = useDialog();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(form);
      dialog.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = loading || isSubmitting;

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required disabled={isBusy} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} disabled={isBusy} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()} disabled={isBusy}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!form.title || isBusy} className="gap-1.5 min-w-[76px]">
          {isBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

export interface TopicDialogBodyProps {
  initialForm: TopicForm;
  onSave: (form: TopicForm) => Promise<void>;
  loading: boolean;
}

export function TopicDialogBody({ initialForm, onSave, loading }: TopicDialogBodyProps) {
  const [form, setForm] = React.useState<TopicForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const dialog = useDialog();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(form);
      dialog.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = loading || isSubmitting;

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required disabled={isBusy} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} disabled={isBusy} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()} disabled={isBusy}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!form.title || isBusy} className="gap-1.5 min-w-[76px]">
          {isBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

export interface QuizDialogBodyProps {
  initialTopicId: string;
  onSuccess: (result: { totalQuestions: number; quizzesCreated: number }) => Promise<void>;
}

export function QuizDialogBody({ initialTopicId, onSuccess }: QuizDialogBodyProps) {
  const dialog = useDialog();

  return (
    <GenerateQuizForm
      initialTopicId={initialTopicId}
      onSuccess={async (result) => {
        await onSuccess(result);
        dialog.close();
      }}
    />
  );
}

export interface QuestionDialogBodyProps {
  initialForm: QuestionForm;
  onSave: (form: QuestionForm) => Promise<void>;
  loading: boolean;
}

export function QuestionDialogBody({ initialForm, onSave, loading }: QuestionDialogBodyProps) {
  const [form, setForm] = React.useState<QuestionForm>({
    ...initialForm,
    invertInDark: initialForm.invertInDark !== undefined ? initialForm.invertInDark : true,
  });
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const dialog = useDialog();

  const handleOptionChange = (idx: number, val: string) => {
    setForm(prev => {
      const newOpts = [...prev.options];
      newOpts[idx] = val;
      let newCorrect = prev.correctAnswer;
      if (prev.correctAnswer === prev.options[idx]) {
        newCorrect = val;
      }
      return { ...prev, options: newOpts, correctAnswer: newCorrect };
    });
  };

  const handleAiGenerateExplanation = async () => {
    if (!form.text.trim()) {
      setAiError("Please enter question text first.");
      return;
    }

    if (!form.correctAnswer) {
      setAiError("Please select the correct answer option first.");
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      let imagePayload = form.imageUrl;
      if (form.imageUrl && !form.imageUrl.startsWith("data:image/")) {
        try {
          const imgRes = await fetch(form.imageUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const dataUri = await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
            if (dataUri) imagePayload = dataUri;
          }
        } catch {
          // Fallback to original URL
        }
      }

      const detectedLang =
        form.language ||
        (/[\u0A80-\u0AFF]/.test(form.text)
          ? "gu"
          : /[\u0900-\u097F]/.test(form.text)
          ? "hi"
          : "en");

      const res = await fetch("/api/admin/questions/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text,
          options: form.options.filter(Boolean),
          correctAnswer: form.correctAnswer,
          imageUrl: imagePayload,
          language: detectedLang,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || "Failed to generate explanation.");
      } else {
        setForm(prev => ({
          ...prev,
          description: data.explanation || prev.description,
          hint: data.hint || prev.hint,
        }));
      }
    } catch {
      setAiError("Error connecting to AI service.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(form);
      dialog.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = loading || isSubmitting;

  const detectedLang =
    form.language ||
    (/[\u0A80-\u0AFF]/.test(form.text)
      ? "gu"
      : /[\u0900-\u097F]/.test(form.text)
      ? "hi"
      : "en");

  return (
    <div
      data-lang={detectedLang}
      className="flex flex-col gap-4 mt-3 max-h-[75vh] overflow-y-auto pr-1"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
        <Textarea
          value={form.text}
          onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Enter the question text (e.g. In the given circuit diagram below, calculate the equivalent resistance...)"
          rows={3}
          required
          disabled={isBusy}
        />
      </div>

      {/* Reusable Diagram / Image Upload Component */}
      <ImageUploader
        value={form.imageUrl}
        onChange={(url) => setForm(prev => ({ ...prev, imageUrl: url }))}
        invertInDark={form.invertInDark}
        onInvertInDarkChange={(invert) => setForm(prev => ({ ...prev, invertInDark: invert }))}
        disabled={isBusy || isGeneratingAi}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {form.options.map((opt, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {idx + 1} <span className="text-danger">*</span></label>
            <Input
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              placeholder={`Enter option ${idx + 1}`}
              required
              disabled={isBusy}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correct Answer <span className="text-danger">*</span></label>
        <Select
          value={form.correctAnswer}
          onChange={e => setForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
          required
          disabled={isBusy}
        >
          <option value="">Select correct option...</option>
          {form.options.filter(Boolean).map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hint (Optional)</label>
        <Input
          value={form.hint}
          onChange={e => setForm(prev => ({ ...prev, hint: e.target.value }))}
          placeholder="e.g. Apply Kirchhoff's current law at node A..."
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Explanation / Description <span className="text-danger">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGeneratingAi || isBusy}
            onClick={handleAiGenerateExplanation}
            className="h-7 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1.5 shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>{form.imageUrl ? "Analyzing Diagram..." : "Generating with AI..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{form.imageUrl ? "Generate with Diagram AI" : "Generate with AI"}</span>
              </>
            )}
          </Button>
        </div>
        <Textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Explain step-by-step why this option is correct (or click 'Generate with Diagram AI' above)..."
          rows={4}
          required
          disabled={isBusy}
        />
        {aiError && (
          <p className="text-[11px] text-danger font-medium mt-0.5">{aiError}</p>
        )}
      </div>

      <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()} disabled={isBusy}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!form.text || !form.correctAnswer || !form.description || isBusy || isGeneratingAi}
          className="gap-1.5 min-w-[76px]"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
