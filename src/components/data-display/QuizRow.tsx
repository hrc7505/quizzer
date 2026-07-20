"use client";

import * as React from "react";
import { Link as LinkIcon, MoreHorizontal } from "lucide-react";

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
  onSelectQuiz: (id: string) => void;
  onOpenLinkDialog: (quiz: Quiz) => void;
  onOpenEditDialog: (quiz: Quiz) => void;
  onDeleteQuiz: (quiz: Quiz) => void;
}

export const QuizRow = React.memo(function QuizRow({
  quiz,
  onSelectQuiz,
  onOpenLinkDialog,
  onOpenEditDialog,
  onDeleteQuiz,
}: QuizRowProps) {
  return (
    <tr key={quiz.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="py-3 px-4 text-center font-bold text-muted-foreground">
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
            quiz.topics.map(t => (
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
            <DropdownContent align="right" className="w-44">
              <DropdownItem onClick={() => onOpenEditDialog(quiz)}>Edit Details</DropdownItem>
              <DropdownItem onClick={() => onSelectQuiz(quiz.id)}>Manage Questions</DropdownItem>
              <DropdownItem onClick={() => onDeleteQuiz(quiz)} className="text-danger">Delete Quiz</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
});
