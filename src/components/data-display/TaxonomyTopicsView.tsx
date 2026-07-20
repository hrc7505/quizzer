"use client";

import { memo } from "react";
import { Plus, Search, ChevronRight, Layers, Link as LinkIcon, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/data-display/PageHeader";
import { Pagination } from "@/components/data-display/Pagination";
import { NoData } from "@/components/feedback/NoData";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";

import type { FlatTopic } from "@/components/data-display/TaxonomyManager.types";

interface TaxonomyTopicsViewProps {
  view: "main-topics" | "subtopics";
  topics: FlatTopic[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (v: number) => void;
  onPageSizeChange: (v: number) => void;
  onAddTopic: () => void;
  onSelectTopic: (id: string) => void;
  onLinkSubtopics: (topic: FlatTopic) => void;
  onLinkQuizzes: (topic: FlatTopic) => void;
  onEditTopic: (topic: FlatTopic) => void;
  onDeleteTopic: (id: string, title: string) => void;
  onAddSubtopic: (topic: FlatTopic) => void;
}

function TaxonomyTopicsViewInner({
  view,
  topics,
  searchQuery,
  onSearchChange,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onAddTopic,
  onSelectTopic,
  onLinkSubtopics,
  onLinkQuizzes,
  onEditTopic,
  onDeleteTopic,
  onAddSubtopic,
}: TaxonomyTopicsViewProps) {
  const isMainTopics = view === "main-topics";

  return (
    <>
      <PageHeader
        title={isMainTopics ? "Main Topics" : "Sub Topics"}
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
            {totalItems}
          </Badge>
        }
        description={
          isMainTopics
            ? "Manage top-level topic nodes under Exams or Standalone Topics."
            : "Manage fine-grained subtopics nested under Main Topics."
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
            onClick={onAddTopic}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isMainTopics ? "Add Standalone Topic" : "Add Sub Topic"}</span>
          </Button>
        }
      />

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder={`Search ${isMainTopics ? "main topics" : "subtopics"}...`}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
          }}
          className="pl-9 h-10 w-full"
        />
      </div>

      {topics.length === 0 ? (
        <NoData
          title={`No ${isMainTopics ? "Main Topics" : "Sub Topics"} Found`}
          description={
            isMainTopics
              ? "Create Standalone Topics here, or add main topics to specific Exams from the Exams tab."
              : "Add subtopics directly here, or click the branch icon on any Main Topic in the Main Topics tab."
          }
          icon="warning"
          action={
            <Button
              variant="primary"
              className="gap-1.5 font-semibold text-xs h-9 px-4"
              onClick={onAddTopic}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First {isMainTopics ? "Topic" : "Subtopic"}</span>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/80 shadow-xs overflow-hidden p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Topic Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Hierarchy Level</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-28">Stats</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((item) => (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <button
                        onClick={() => onSelectTopic(item.id)}
                        className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td className="py-3 px-4 select-none">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {item.parentTopics && item.parentTopics.length > 0 && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className="font-medium text-xs">{item.displayType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center select-none font-semibold text-foreground/80">
                      {isMainTopics ? (
                        <span>{item.subtopics?.length || 0} Subtopics</span>
                      ) : (
                        <span>{item.quizzes?.length || 0} Quizzes</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMainTopics ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onLinkSubtopics(item)}
                            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onLinkQuizzes(item)}
                            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent align="right" className="w-44">
                            <DropdownItem onClick={() => onSelectTopic(item.id)}>
                              Manage Associations
                            </DropdownItem>

                            {isMainTopics && (
                              <DropdownItem onClick={() => onAddSubtopic(item)}>
                                Add Sub Topic
                              </DropdownItem>
                            )}

                            <DropdownItem onClick={() => onEditTopic(item)}>
                              Edit Settings
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => onDeleteTopic(item.id, item.title)}
                              className="text-danger"
                            >
                              Delete Topic
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
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

export const TaxonomyTopicsView = memo(TaxonomyTopicsViewInner);
export default TaxonomyTopicsView;