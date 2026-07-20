"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Layers, Link as LinkIcon, Plus, Unlink2, Edit, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { NoData } from "@/components/feedback/NoData";
import { cn } from "@/utils/cn";

import type { Exam, Topic, QuizDetail, QuizQuestionDetail } from "@/components/data-display/TaxonomyManager.types";

interface ExamDrawerBodyProps {
  exam: Exam;
  onLinkTopics: (exam: Exam) => void;
  onUnlinkTopic: (topicId: string, topicTitle: string, examTitle: string, examId?: string) => void;
}

export function ExamDrawerBody({ exam, onLinkTopics, onUnlinkTopic }: ExamDrawerBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
        <p className="text-sm font-medium text-foreground">
          {exam.description || "No description provided."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Linked Topics ({exam.topics?.length || 0})
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 font-semibold text-xs gap-1.5"
            onClick={() => onLinkTopics(exam)}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link Topics</span>
          </Button>
        </div>

        {exam.topics && exam.topics.length > 0 ? (
          <div className="flex flex-col gap-3.5 mt-2">
            {exam.topics.map(t => (
              <Card key={t.id} className="p-3.5 border border-border/80 bg-card shadow-xs flex items-center justify-between gap-4 rounded-xl select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-xs text-foreground truncate">{t.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg shrink-0"
                  onClick={() => onUnlinkTopic(t.id, t.title, exam.title || '', exam.id)}
                  aria-label="Unlink topic"
                >
                  <Unlink2 className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <NoData title="No topics linked to this exam." icon="book" compact={true} />
        )}
      </div>
    </div>
  );
}

interface TopicDrawerBodyProps {
  topic: Topic;
  onLinkSubtopics: (topic: Topic) => void;
  onLinkQuizzes: (topic: Topic) => void;
  onUnlinkSubtopic: (subtopicId: string, subtopicTitle: string, parentTitle: string, parentId?: string) => void;
  onUnlinkQuiz: (quizId: string, quizTitle: string, topicTitle: string) => void;
  onDeleteQuiz: (quizId: string, quizTitle: string) => void;
  onCreateQuiz: (topicId: string) => void;
  difficultyBadgeVariant: (difficulty: string) => BadgeProps["variant"];
}

export function TopicDrawerBody({
  topic,
  onLinkSubtopics,
  onLinkQuizzes,
  onUnlinkSubtopic,
  onUnlinkQuiz,
  onDeleteQuiz,
  onCreateQuiz,
  difficultyBadgeVariant,
}: TopicDrawerBodyProps) {
  const isMainTopic = !topic.parentTopics || topic.parentTopics.length === 0;

  if (isMainTopic) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
          <p className="text-sm font-medium text-foreground">
            {topic.description || "No description provided."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Linked Subtopics ({topic.subtopics?.length || 0})
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-semibold text-xs gap-1.5"
              onClick={() => onLinkSubtopics(topic)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Link Sub Topics</span>
            </Button>
          </div>
          {topic.subtopics && topic.subtopics.length > 0 ? (
            <div className="flex flex-col gap-3.5 mt-2">
              {topic.subtopics.map(t => (
                <Card key={t.id} className="p-3.5 border border-border/80 bg-card shadow-xs flex items-center justify-between gap-4 rounded-xl select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-xs text-foreground truncate">{t.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg shrink-0"
                    onClick={() => onUnlinkSubtopic(t.id, t.title, topic.title || '', topic.id)}
                    aria-label="Unlink subtopic"
                  >
                    <Unlink2 className="h-3.5 w-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <NoData title="No subtopics linked to this topic." icon="book" compact={true} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
        <p className="text-sm font-medium text-foreground">
          {topic.description || "No description provided."}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Linked Quizzes ({topic.quizzes?.length || 0})
          </h3>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-semibold text-xs gap-1.5"
              onClick={() => onLinkQuizzes(topic)}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link Quizzes</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 font-semibold text-xs gap-1.5 shadow-xs"
              onClick={() => onCreateQuiz(topic.id)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Quiz</span>
            </Button>
          </div>
        </div>
        {topic.quizzes && topic.quizzes.length > 0 ? (
          <div className="flex flex-col gap-3.5 mt-2">
            {topic.quizzes.map(q => (
              <Card key={q.id} className="p-3.5 border border-border/80 bg-card shadow-xs flex items-center justify-between gap-4 rounded-xl select-none">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <Link href={`/admin/manage/quizzes/${q.id}/questions`}>
                    <span className="font-semibold text-xs text-foreground truncate hover:text-primary transition-colors block cursor-pointer">
                      {q.title}
                    </span>
                  </Link>
                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                    Order: #{q.quizOrder} • {q._count?.questions || 0} Questions
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={difficultyBadgeVariant(q.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 animate-none">
                    {q.difficulty}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                    onClick={() => onUnlinkQuiz(q.id, q.title, topic.title || '')}
                    aria-label="Unlink quiz"
                  >
                    <Unlink2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                    onClick={() => onDeleteQuiz(q.id, q.title)}
                    aria-label="Delete quiz"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <NoData title="No quizzes linked to this subtopic." icon="book" compact={true} />
        )}
      </div>
    </div>
  );
}

interface QuizDrawerBodyProps {
  quiz: QuizDetail | null;
  loading: boolean;
  onAddQuestion: () => void;
  onEditQuestion: (q: QuizQuestionDetail) => void;
  onDeleteQuestion: (questionId: string, text: string) => void;
  difficultyBadgeVariant: (difficulty: string) => BadgeProps["variant"];
}

export function QuizDrawerBody({
  quiz,
  loading,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  difficultyBadgeVariant,
}: QuizDrawerBodyProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Order #{quiz?.quizOrder}</span>
          {quiz && (
            <Badge variant={difficultyBadgeVariant(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5 animate-none">
              {quiz.difficulty}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-1.5 select-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Questions ({quiz?.questions?.length || 0})
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
        ) : quiz?.questions && quiz.questions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {quiz.questions.map((q, idx: number) => (
              <Card key={q.id} className="p-5 border border-border/80 bg-card shadow-sm flex flex-col gap-4 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-xs font-bold text-foreground leading-snug">
                    {idx + 1}. {q.text}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg border border-border/50 bg-surface"
                      onClick={() => onEditQuestion(q)}
                      aria-label="Edit question"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                      onClick={() => onDeleteQuestion(q.id, q.text)}
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 select-none">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <div
                        key={oIdx}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold",
                          isCorrect
                            ? "border-success/20 bg-success/5 text-success"
                            : "border-border/40 bg-card text-foreground/70"
                        )}
                      >
                        <span className="opacity-75">{oIdx + 1}.</span>
                        <span className="truncate">{opt} {isCorrect && "✓"}</span>
                      </div>
                    );
                  })}
                </div>

                {(q.hint || q.description) && (
                  <div className="flex flex-col gap-1.5 bg-secondary/10 rounded-lg p-3 text-[10px] text-muted-foreground border border-border/30 select-none">
                    {q.hint && (
                      <div>
                        <strong className="text-foreground/90 font-bold">Hint:</strong> <span className="font-medium text-muted-foreground/95">{q.hint}</span>
                      </div>
                    )}
                    {q.description && (
                      <div className={cn(q.hint && "border-t border-border/20 pt-1.5 mt-0.5")}>
                        <strong className="text-foreground/90 font-bold">Explanation:</strong> <span className="font-medium text-muted-foreground/95 whitespace-pre-wrap">{q.description}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <NoData title="No questions linked." description="Click Add Question to build questions manually." icon="book" compact={true} />
        )}
      </div>
    </div>
  );
}
