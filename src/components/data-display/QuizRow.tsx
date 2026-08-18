"use client";

import * as React from "react";
import { Link as LinkIcon, MoreHorizontal, Sparkles, Pencil, ListOrdered, Trash2, Layers } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { difficultyColor } from "@/lib/format";

interface TopicRef {
  id: string;
  title: string;
  parentTopics?: { id: string }[];
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  topics: TopicRef[];
  _count: { questions: number; attempts: number };
}

export interface QuizRowProps {
  quiz: Quiz;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelectQuiz: (id: string) => void;
  onOpenLinkDialog: (quiz: Quiz) => void;
  onOpenEditDialog: (quiz: Quiz) => void;
  onDeleteQuiz: (quiz: Quiz) => void;
  onAppendQuestions?: (quiz: Quiz) => void;
  onFindDuplicates?: (quiz: Quiz) => void;
}

export const QuizRow = React.memo(function QuizRow({
  quiz,
  isSelected = false,
  onToggleSelect,
  onSelectQuiz,
  onOpenLinkDialog,
  onOpenEditDialog,
  onDeleteQuiz,
  onAppendQuestions,
  onFindDuplicates,
}: QuizRowProps) {
  return (
    <tr
      key={quiz.id}
      className={`border-b border-border/20 hover:bg-secondary/20 transition-colors ${
        isSelected ? "bg-primary/5 hover:bg-primary/10" : ""
      }`}
    >
      <td className="py-3 px-3 text-center">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(quiz.id)}
            aria-label={`Select quiz ${quiz.title}`}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary align-middle"
          />
        )}
      </td>
      <td className="py-3 px-3 text-center font-bold text-muted-foreground">
        #{quiz.quizOrder}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onSelectQuiz(quiz.id)}
          className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer block max-w-sm truncate border-0 bg-transparent p-0"
        >
          {quiz.title}
        </button>
      </td>
      <td className="py-3 px-4 text-center select-none">
        <Badge variant={difficultyColor(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 animate-none">
          {quiz.difficulty}
        </Badge>
      </td>
      <td className="py-3 px-4 text-center font-bold text-foreground/90">{quiz._count.questions}</td>
      <td className="py-3 px-4 text-center font-bold text-foreground/80">{quiz._count.attempts}</td>
      <td className="py-3 px-4 max-w-xs select-none">
        <div className="flex flex-wrap gap-1">
          {quiz.topics.length > 0 ? (
            quiz.topics.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-[10px] px-1.5 py-0 animate-none">
                {t.title}
              </Badge>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic font-medium">Unlinked</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-center select-none">
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenLinkDialog(quiz)}
            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
            aria-label="Link topics"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-52">
              <DropdownItem onClick={() => onOpenEditDialog(quiz)} className="gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Edit Details</span>
              </DropdownItem>
              <DropdownItem onClick={() => onSelectQuiz(quiz.id)} className="gap-2">
                <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Manage Questions</span>
              </DropdownItem>
              {onFindDuplicates && (
                <DropdownItem onClick={() => onFindDuplicates(quiz)} className="gap-2 text-amber-600 dark:text-amber-400 font-medium">
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  <span>Find Duplicates</span>
                </DropdownItem>
              )}
              {onAppendQuestions && (
                <DropdownItem onClick={() => onAppendQuestions(quiz)} className="gap-2 text-primary font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>AI Append Questions</span>
                </DropdownItem>
              )}
              <DropdownItem onClick={() => onDeleteQuiz(quiz)} className="gap-2 text-danger">
                <Trash2 className="h-3.5 w-3.5 text-danger" />
                <span>Delete Quiz</span>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
});
