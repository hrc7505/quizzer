"use client";

import { memo } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/data-display/PageHeader";
import { Pagination } from "@/components/data-display/Pagination";
import { NoData } from "@/components/feedback/NoData";
import { TaxonomyExamRow } from "@/components/data-display/TaxonomyExamRow";
import type { Exam } from "@/components/data-display/TaxonomyManager.types";

interface TaxonomyExamsViewProps {
  exams: Exam[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (v: number) => void;
  onPageSizeChange: (v: number) => void;
  onAddExam: () => void;
  onSelectExam: (id: string) => void;
  onOpenLinkDialog: (exam: Exam) => void;
  onOpenEditDialog: (exam: Exam) => void;
  onDeleteExam: (id: string, title: string) => void;
}

function TaxonomyExamsViewInner({
  exams,
  searchQuery,
  onSearchChange,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onAddExam,
  onSelectExam,
  onOpenLinkDialog,
  onOpenEditDialog,
  onDeleteExam,
}: TaxonomyExamsViewProps) {
  return (
    <>
      <PageHeader
        title="Exams"
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
            {totalItems}
          </Badge>
        }
        description="Manage the top-level exams representing major categories of your curriculum."
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
            onClick={onAddExam}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Exam</span>
          </Button>
        }
      />

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
          }}
          className="pl-9 h-10 w-full"
        />
      </div>

      {exams.length === 0 ? (
        <NoData
          title="No Exams Found"
          description="Create an exam category to start structuring your topics and subtopics."
          icon="warning"
          action={
            <Button
              variant="primary"
              className="gap-1.5 font-semibold text-xs h-9 px-4"
              onClick={onAddExam}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Exam</span>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/80 shadow-xs overflow-hidden p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Exam Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Description</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Main Topics</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((item) => (
                  <TaxonomyExamRow
                    key={item.id}
                    exam={item}
                    onSelectExam={onSelectExam}
                    onOpenLinkDialog={onOpenLinkDialog}
                    onOpenEditDialog={onOpenEditDialog}
                    onDeleteExam={onDeleteExam}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageSizeChange={onPageSizeChange}
            onPageChange={onPageChange}
          />
        </Card>
      )}
    </>
  );
}

export const TaxonomyExamsView = memo(TaxonomyExamsViewInner);
export default TaxonomyExamsView;