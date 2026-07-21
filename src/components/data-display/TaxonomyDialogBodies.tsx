"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useDialog } from "@/components/providers/OverlayProvider";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";

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

export interface QuestionForm {
  id: string;
  text: string;
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
  const dialog = useDialog();

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={async () => { await onSave(form); dialog.close(); }} disabled={!form.title || loading}>Save</Button>
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
  const dialog = useDialog();

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={async () => { await onSave(form); dialog.close(); }} disabled={!form.title || loading}>Save</Button>
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
  const [form, setForm] = React.useState<QuestionForm>(initialForm);
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

  const handleSave = async () => {
    await onSave(form);
    dialog.close();
  };

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
        <Textarea
          value={form.text}
          onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Enter the question text..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {form.options.map((opt, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {idx + 1} <span className="text-danger">*</span></label>
            <Input
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              placeholder={`Enter option ${idx + 1}`}
              required
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
          placeholder="e.g. Think about..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Explanation / Description <span className="text-danger">*</span></label>
        <Textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Explain why this option is correct..."
          rows={3}
          required
        />
      </div>

      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!form.text || !form.correctAnswer || !form.description || loading}>
          Save
        </Button>
      </div>
    </div>
  );
}
