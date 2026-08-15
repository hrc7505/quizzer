"use client";

import * as React from "react";
import { Layers, ChevronRight, Link as LinkIcon, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";

import type { FlatTopic } from "@/components/data-display/TaxonomyManager.types";

export interface TaxonomyTopicRowProps {
  topic: FlatTopic;
  view: "main-topics" | "subtopics";
  onSelectTopic: (id: string) => void;
  onOpenLinkSubtopicsDialog: (topic: FlatTopic) => void;
  onOpenLinkQuizzesDialog: (topic: FlatTopic) => void;
  onOpenNewTopicDialog: (examId: string, parentId: string) => void;
  onOpenEditDialog: (topic: FlatTopic) => void;
  onDeleteTopic: (id: string, title: string) => void;
}

export const TaxonomyTopicRow = React.memo(function TaxonomyTopicRow({
  topic,
  view,
  onSelectTopic,
  onOpenLinkSubtopicsDialog,
  onOpenLinkQuizzesDialog,
  onOpenNewTopicDialog,
  onOpenEditDialog,
  onDeleteTopic,
}: TaxonomyTopicRowProps) {
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="py-3 px-4 font-semibold text-foreground">
        <button
          onClick={() => onSelectTopic(topic.id)}
          className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
        >
          {topic.title}
        </button>
      </td>
      <td className="py-3 px-4 select-none">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {topic.parentTopics && topic.parentTopics.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
          <span className="font-medium text-xs">{topic.displayType}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center select-none font-semibold text-foreground/80">
        {view === "main-topics" ? (
          <span>{topic.subtopics?.length || 0} Subtopics</span>
        ) : (
          <span>{topic.quizzes?.length || 0} Quizzes</span>
        )}
      </td>
      <td className="py-3 px-4 text-center select-none">
        <div className="flex items-center justify-center gap-1.5">
          {(!topic.parentTopics || topic.parentTopics.length === 0) ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenLinkSubtopicsDialog(topic)}
              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
            >
              <Layers className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenLinkQuizzesDialog(topic)}
              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          )}

          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-44">
              <DropdownItem onClick={() => onSelectTopic(topic.id)}>Manage Associations</DropdownItem>

              {(!topic.parentTopics || topic.parentTopics.length === 0) && (
                <DropdownItem onClick={() => onOpenNewTopicDialog('', topic.id)}>Add Sub Topic</DropdownItem>
              )}

              <DropdownItem onClick={() => onOpenEditDialog(topic)}>Edit Settings</DropdownItem>
              <DropdownItem onClick={() => onDeleteTopic(topic.id, topic.title)} className="text-danger">Delete Topic</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
});
