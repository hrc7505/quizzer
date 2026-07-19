"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { Link as LinkIcon, MoreHorizontal } from "lucide-react";

import type { Exam } from "./TaxonomyManager.types";

export interface TaxonomyExamRowProps {
  exam: Exam;
  onSelectExam: (id: string) => void;
  onOpenLinkDialog: (exam: Exam) => void;
  onOpenEditDialog: (exam: Exam) => void;
  onDeleteExam: (id: string, title: string) => void;
}

export const TaxonomyExamRow = React.memo(function TaxonomyExamRow({
  exam,
  onSelectExam,
  onOpenLinkDialog,
  onOpenEditDialog,
  onDeleteExam,
}: TaxonomyExamRowProps) {
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="py-3 px-4 font-semibold text-foreground">
        <button
          onClick={() => onSelectExam(exam.id)}
          className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
        >
          {exam.title}
        </button>
      </td>
      <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-xs">
        {exam.description || "No description provided."}
      </td>
      <td className="py-3 px-4 text-center font-bold text-foreground/90">{exam.topics.length}</td>
      <td className="py-3 px-4 text-center select-none">
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenLinkDialog(exam)}
            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-44">
              <DropdownItem onClick={() => onSelectExam(exam.id)}>Manage Topics</DropdownItem>
              <DropdownItem onClick={() => onOpenEditDialog(exam)}>Edit Settings</DropdownItem>
              <DropdownItem onClick={() => onDeleteExam(exam.id, exam.title)} className="text-danger">Delete Exam</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
});
