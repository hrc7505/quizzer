"use client";

import * as React from "react";
import { BookOpen, Plus, X, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { NoData } from "@/components/feedback/NoData";
import { QuestionCard } from "@/components/data-display/QuestionCard";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export interface QuizFormState {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: string;
}

interface EditQuizBodyProps {
  form: QuizFormState;
  onChange: (updater: (prev: QuizFormState) => QuizFormState) => void;
}

export function EditQuizBody({ form, onChange }: EditQuizBodyProps) {
  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quiz Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => onChange(f => ({ ...f, title: e.target.value }))} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty <span className="text-danger">*</span></label>
        <Select value={form.difficulty} onChange={e => onChange(f => ({ ...f, difficulty: e.target.value }))} required>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order / Position</label>
        <Input type="number" placeholder="Leave blank for auto" value={form.quizOrder} onChange={e => onChange(f => ({ ...f, quizOrder: e.target.value }))} />
      </div>
    </div>
  );
}

interface QuizTopicRef {
  id: string;
  title: string;
}

interface QuizDrawerQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
}

interface QuizDrawerDetail {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  questions?: QuizDrawerQuestion[];
}

interface QuizDrawerBodyProps {
  quiz: { id: string; title: string; topics?: QuizTopicRef[] } | null;
  detail: QuizDrawerDetail | null;
  loading: boolean;
  onUnlinkTopic: (quizId: string, quizTitle: string, topicId: string, topicTitle: string) => void;
  onAddQuestion: () => void;
  onEditQuestion: (q: QuizDrawerQuestion) => void;
  onDeleteQuestion: (questionId: string, text: string) => void;
}

export function QuizDrawerBody({
  quiz,
  detail,
  loading,
  onUnlinkTopic,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: QuizDrawerBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Linked topics section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5 select-none">
          Linked Topics
        </h3>

        {quiz?.topics && quiz.topics.length > 0 ? (
          <div className="flex flex-wrap gap-2.5 select-none">
            {quiz.topics.map(t => (
              <div key={t.id} className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/5 text-primary border border-primary/20 rounded-lg text-xs font-semibold">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span>{t.title}</span>
                <button
                  onClick={() => quiz && onUnlinkTopic(quiz.id, quiz.title, t.id, t.title)}
                  className="text-primary/60 hover:text-danger cursor-pointer shrink-0 ml-1 active:scale-95 duration-100"
                  title="Unlink topic"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <NoData
            title="No topics linked."
            description='Click "Link Topics" to associate this quiz with subtopics.'
            icon="book"
            compact={true}
          />
        )}
      </div>

      {/* Questions section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Questions ({detail?.questions?.length || 0})
          </h3>
          <Button variant="outline" size="sm" className="h-8 font-semibold text-xs gap-1.5" onClick={onAddQuestion}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add Question</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground select-none">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading questions...</span>
          </div>
        ) : detail?.questions && detail.questions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {detail.questions.map((q, idx: number) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onEdit={onEditQuestion}
                onDelete={(item) => onDeleteQuestion(item.id, item.text)}
              />
            ))}
          </div>
        ) : (
          <NoData
            title="No questions linked."
            description='Click "Add Question" to build questions manually.'
            icon="book"
            compact={true}
          />
        )}
      </div>
    </div>
  );
}
