"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export interface QuestionEditorForm {
  id: string;
  quizId?: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

interface QuizOption {
  id: string;
  title: string;
}

export interface QuestionEditorBodyProps {
  form: QuestionEditorForm;
  onChange: (updater: (prev: QuestionEditorForm) => QuestionEditorForm) => void;
  onOptionChange: (idx: number, val: string) => void;
  quizzes?: QuizOption[];
  onQuizChange?: (val: string) => void;
  descriptionRequired?: boolean;
  loading?: boolean;
}

export function QuestionEditorBody({
  form,
  onChange,
  onOptionChange,
  quizzes,
  onQuizChange,
  descriptionRequired,
  loading,
}: QuestionEditorBodyProps) {
  return (
    <div className="flex flex-col gap-4 mt-3">
      {quizzes && onQuizChange && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parent Quiz <span className="text-danger">*</span></label>
          <Select value={form.quizId ?? ""} onChange={e => onQuizChange(e.target.value)} required>
            <option value="">Select quiz assignment...</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
        <Textarea
          value={form.text}
          onChange={e => onChange(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Enter the question text..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {form.options.map((opt, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {String.fromCharCode(65 + idx)} <span className="text-danger">*</span></label>
            <Input
              value={opt}
              onChange={e => onOptionChange(idx, e.target.value)}
              placeholder={`Enter option ${String.fromCharCode(65 + idx)}`}
              required
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correct Answer <span className="text-danger">*</span></label>
        <Select
          value={form.correctAnswer}
          onChange={e => onChange(prev => ({ ...prev, correctAnswer: e.target.value }))}
          required
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
          onChange={e => onChange(prev => ({ ...prev, hint: e.target.value }))}
          placeholder="Enter a brief hint..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Explanation / Description {descriptionRequired && <span className="text-danger">*</span>}
        </label>
        <Textarea
          value={form.description}
          onChange={e => onChange(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Explain why this answer is correct..."
          rows={3}
          required={descriptionRequired}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}
