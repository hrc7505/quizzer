"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  Search,
  Link as LinkIcon,
  MoreHorizontal,
  Unlink,
  Sparkles,
  HelpCircle,
  Layers,
  Square,
  CheckSquare,
  Trash2,
  GitMerge,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { FloatingActionBar } from "@/components/ui/FloatingActionBar";
import { PageHeader } from "@/components/data-display/PageHeader";
import { Pagination } from "@/components/data-display/Pagination";
import { NoData } from "@/components/feedback/NoData";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { EditQuizDialogBody, type QuizFormState } from "@/components/data-display/QuizManagerBodies";
import { MergeQuizzesDialogBody } from "@/components/data-display/MergeQuizzesDialogBody";
import { DeleteConfirmDialogBody } from "@/components/feedback/DeleteConfirmDialogBody";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { useDialog } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { BatchQueueManager } from "@/components/data-display/BatchQueueManager";
import { useBatchLiveSync } from "@/hooks/useBatchLiveSync";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { difficultyColor } from "@/lib/format";
import { api } from "@/lib/api";
import { cn } from "@/utils/cn";

import type {
  SubtopicQuizzesManagerProps,
  SubtopicQuizItem,
  SubtopicWithQuizzes,
} from "@/components/data-display/interfaces/SubtopicQuizzesManager.interface";

/**
 * SubtopicQuizzesManager component.
 * Manages the list of Quizzes attached to a specific Subtopic.
 * Supports direct AI quiz generation (auto-linked to subtopic), manual creation,
 * linking existing quizzes, multi-quiz bulk deletion, contextual unlinking, and safe deletion.
 */
export function SubtopicQuizzesManager({
  subtopic: initialSubtopic,
  availableQuizzes = [],
}: SubtopicQuizzesManagerProps) {
  const router = useRouter();
  const dialog = useDialog();
  const toast = useToast();

  const [subtopic, setSubtopic] = useState<SubtopicWithQuizzes>(initialSubtopic);
  const [unlinkedQuizzes, setUnlinkedQuizzes] = useState<SubtopicQuizItem[]>(availableQuizzes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Multi-selection state for batch actions
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const prevSelectedCountRef = useRef(0);

  // Link picker state
  const [linkModalSelectedIds, setLinkModalSelectedIds] = useState<string[]>([]);
  const linkModalSelectedIdsRef = useRef<string[]>([]);
  useEffect(() => {
    linkModalSelectedIdsRef.current = linkModalSelectedIds;
  }, [linkModalSelectedIds]);

  /**
   * Refreshes the quizzes for this subtopic from the server.
   */
  const refreshQuizzes = useCallback(async () => {
    try {
      const res = await api.get<{ quizzes?: SubtopicQuizItem[] }>(`/api/admin/topics/${subtopic.id}`);
      if (res.success && res.data?.quizzes) {
        setSubtopic((prev) => ({ ...prev, quizzes: res.data?.quizzes || [] }));
      }
      const allRes = await api.get<SubtopicQuizItem[]>("/api/admin/quizzes");
      if (allRes.success && allRes.data) {
        setUnlinkedQuizzes(
          allRes.data.filter((q) => !q.topics?.some((t) => t.id === subtopic.id))
        );
      }
    } catch (e) {
      console.error("Failed to refresh quizzes:", e);
    }
  }, [subtopic.id]);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return subtopic.quizzes.filter(
      (q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subtopic.quizzes, searchQuery]);

  const totalItems = filteredQuizzes.length;
  const paginatedQuizzes = useMemo(() => {
    return filteredQuizzes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredQuizzes, currentPage, pageSize]);

  const isAllCurrentPageSelected =
    paginatedQuizzes.length > 0 &&
    paginatedQuizzes.every((q) => selectedQuizIds.includes(q.id));

  // Sound feedback on multi-selection
  useEffect(() => {
    if (selectedQuizIds.length > prevSelectedCountRef.current) {
      soundEffects.playPopSound();
    }
    prevSelectedCountRef.current = selectedQuizIds.length;
  }, [selectedQuizIds.length]);

  const handleToggleSelectQuiz = (id: string) => {
    setSelectedQuizIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedQuizzes.map((q) => q.id));
      setSelectedQuizIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newSelected = Array.from(
        new Set([...selectedQuizIds, ...paginatedQuizzes.map((q) => q.id)])
      );
      setSelectedQuizIds(newSelected);
    }
  };

  const handleClearSelection = () => {
    soundEffects.playClearSound();
    setSelectedQuizIds([]);
  };

  const parentTopic = subtopic.parentTopics?.[0];

  // Live background batch tracking to keep quizzes synchronized without manual reloads
  const batchSync = useBatchLiveSync({
    topicId: subtopic.id,
    onRefresh: refreshQuizzes,
    onComplete: () => {
      toast.addToast({
        type: "success",
        message: "Background quiz generation completed! Quizzes updated.",
      });
    },
  });

  /**
   * Opens the Generate Quiz dialog pre-targeted to this subtopic.
   */
  const handleOpenGenerateQuiz = useCallback(() => {
    dialog.open({
      title: `Generate Quiz for "${subtopic.title}"`,
      showClose: true,
      body: (
        <GenerateQuizForm
          initialTopicId={subtopic.id}
          onSuccess={async (result) => {
            await refreshQuizzes();
            dialog.close();
            if (result?.isBatched) {
              batchSync.triggerSync();
              toast.addToast({
                type: "info",
                message: `Created ${result.batchesCreated} background batch(es). Quizzes will update live automatically!`,
              });
            } else {
              toast.addToast({ type: "success", message: "Quiz generated successfully" });
            }
          }}
        />
      ),
    });
  }, [dialog, subtopic.id, subtopic.title, refreshQuizzes, toast, batchSync]);

  /**
   * Opens the Batch Queue dialog panel for this subtopic.
   */
  const handleOpenBatchQueue = useCallback(() => {
    dialog.open({
      title: `Batch Queue - "${subtopic.title}"`,
      showClose: true,
      className: "max-w-2xl sm:max-w-3xl",
      body: (
        <div className="py-1">
          <BatchQueueManager initialTopicId={subtopic.id} hideHeader={true} />
        </div>
      ),
    });
  }, [dialog, subtopic.id, subtopic.title]);

  /**
   * Opens the Link Existing Quizzes dialog.
   */
  const handleOpenLinkDialog = useCallback(() => {
    setLinkModalSelectedIds(subtopic.quizzes.map((q) => q.id));
    dialog.open({
      title: "Link Existing Quizzes",
      showClose: false,
      body: (
        <LinkPicker
          description={`Select existing quizzes to link to "${subtopic.title}".`}
          label="Quizzes"
          placeholder="Search quizzes..."
          items={unlinkedQuizzes}
          selectedIds={linkModalSelectedIds}
          onSelectionChange={setLinkModalSelectedIds}
          selectionRef={linkModalSelectedIdsRef}
          emptyHint="No unlinked quizzes found. You can generate a new quiz directly."
        />
      ),
      okText: "Save Links",
      onOk: async () => {
        setLoading(true);
        const idsToSave = linkModalSelectedIdsRef.current;
        const res = await api.post(`/api/admin/topics/${subtopic.id}/link-quizzes`, { quizIds: idsToSave });
        if (res.success) {
          await refreshQuizzes();
          toast.addToast({ type: "success", message: "Quizzes linked to subtopic" });
        } else {
          setError(res.error || "Failed to link quizzes");
        }
        setLoading(false);
      },
    });
  }, [dialog, subtopic.title, subtopic.id, subtopic.quizzes, unlinkedQuizzes, linkModalSelectedIds, refreshQuizzes, toast]);

  /**
   * Opens the Edit Quiz dialog.
   */
  const handleOpenEditQuiz = useCallback(
    (quiz: SubtopicQuizItem) => {
      dialog.open({
        title: "Edit Quiz",
        body: (
          <EditQuizDialogBody
            initialForm={{
              id: quiz.id,
              title: quiz.title,
              difficulty: quiz.difficulty,
              quizOrder: quiz.quizOrder ? quiz.quizOrder.toString() : "",
            }}
            onSave={async (form: QuizFormState) => {
              setLoading(true);
              const res = await api.put(`/api/admin/quizzes/${form.id}`, {
                title: form.title,
                difficulty: form.difficulty,
                quizOrder: form.quizOrder ? parseInt(form.quizOrder) : null,
              });
              if (res.success) {
                await refreshQuizzes();
                toast.addToast({ type: "success", message: "Quiz updated" });
              } else {
                setError(res.error || "Failed to edit quiz");
              }
              setLoading(false);
            }}
            loading={loading}
          />
        ),
      });
    },
    [dialog, refreshQuizzes, toast, loading]
  );

  /**
   * Unlinks a quiz from this subtopic only.
   */
  const handleUnlink = useCallback(
    (quiz: SubtopicQuizItem) => {
      dialog.confirm({
        title: "Unlink Quiz from Subtopic",
        description: `Are you sure you want to unlink "${quiz.title}" from "${subtopic.title}"? The quiz and its questions will remain in the database.`,
        okText: "Unlink",
        onConfirm: async () => {
          setLoading(true);
          const nextQuizIds = subtopic.quizzes.filter((q) => q.id !== quiz.id).map((q) => q.id);
          const res = await api.post(`/api/admin/topics/${subtopic.id}/link-quizzes`, { quizIds: nextQuizIds });
          if (res.success) {
            await refreshQuizzes();
            toast.addToast({ type: "success", message: "Quiz unlinked from subtopic" });
          } else {
            setError(res.error || "Failed to unlink quiz");
          }
          setLoading(false);
        },
      });
    },
    [dialog, subtopic.title, subtopic.id, subtopic.quizzes, refreshQuizzes, toast]
  );

  /**
   * Bulk unlinks all selected quizzes from this subtopic.
   */
  const handleBulkUnlink = useCallback(() => {
    if (selectedQuizIds.length === 0) return;
    const selectedTitles = subtopic.quizzes
      .filter((q) => selectedQuizIds.includes(q.id))
      .map((q) => q.title);

    dialog.confirm({
      title: `Unlink ${selectedQuizIds.length} Quizzes from Subtopic`,
      description: `Are you sure you want to unlink ${selectedQuizIds.length} selected quizzes (${selectedTitles.slice(0, 3).join(", ")}${selectedTitles.length > 3 ? "..." : ""}) from "${subtopic.title}"? The quizzes will remain in the database.`,
      okText: `Unlink ${selectedQuizIds.length} Quizzes`,
      onConfirm: async () => {
        setLoading(true);
        const nextQuizIds = subtopic.quizzes
          .filter((q) => !selectedQuizIds.includes(q.id))
          .map((q) => q.id);
        const res = await api.post(`/api/admin/topics/${subtopic.id}/link-quizzes`, { quizIds: nextQuizIds });
        if (res.success) {
          soundEffects.playCorrectSound();
          setSelectedQuizIds([]);
          await refreshQuizzes();
          toast.addToast({ type: "success", message: `Unlinked ${selectedTitles.length} quizzes from subtopic` });
        } else {
          setError(res.error || "Failed to unlink selected quizzes");
        }
        setLoading(false);
      },
    });
  }, [dialog, selectedQuizIds, subtopic.quizzes, subtopic.title, subtopic.id, refreshQuizzes, toast]);

  /**
   * Opens the Merge Multiple Quizzes dialog for selected quizzes.
   */
  const handleOpenMergeDialog = useCallback(() => {
    const selectedList = subtopic.quizzes.filter((q) => selectedQuizIds.includes(q.id));
    if (selectedList.length < 2) {
      toast.addToast({ type: "warning", message: "Please select at least 2 quizzes to merge." });
      return;
    }

    const initialState = {
      targetQuizId: selectedList[0].id,
      targetTitle: selectedList[0].title,
    };

    dialog.open({
      title: "Merge Quizzes",
      body: (
        <MergeQuizzesDialogBody
          selectedQuizzes={selectedList}
          initialForm={initialState}
          onConfirm={async (finalForm) => {
            const targetId = finalForm.targetQuizId || selectedList[0].id;
            const sourceIds = selectedList.map((q) => q.id).filter((id) => id !== targetId);

            setLoading(true);
            try {
              const res = await fetch("/api/admin/quizzes/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetQuizId: targetId,
                  sourceQuizIds: sourceIds,
                  targetTitle: finalForm.targetTitle,
                }),
              });

              const data = await res.json();
              if (res.ok && !data.error) {
                soundEffects.playCorrectSound();
                setSelectedQuizIds([]);
                await refreshQuizzes();
                toast.addToast({
                  type: "success",
                  message: data.message || `Successfully merged ${selectedList.length} quizzes!`,
                });
              } else {
                toast.addToast({
                  type: "error",
                  message: data.error || "Failed to merge quizzes",
                });
                throw new Error(data.error);
              }
            } catch (err) {
              console.error("Merge error:", err);
              toast.addToast({ type: "error", message: "An unexpected error occurred during merge" });
              throw err;
            } finally {
              setLoading(false);
            }
          }}
        />
      ),
    });
  }, [dialog, subtopic.quizzes, selectedQuizIds, refreshQuizzes, toast]);

  /**
   * Bulk deletes all selected quizzes permanently.
   */
  const handleBulkDelete = useCallback(() => {
    if (selectedQuizIds.length === 0) return;
    const selectedList = subtopic.quizzes.filter((q) => selectedQuizIds.includes(q.id));

    dialog.confirm({
      title: `Delete ${selectedQuizIds.length} Quizzes`,
      okText: `Delete ${selectedQuizIds.length} Quizzes`,
      okVariant: "danger",
      body: (
        <DeleteConfirmDialogBody
          title={`${selectedQuizIds.length} Selected Quizzes`}
          itemType="Quizzes"
          linkSummaries={[
            { label: "Parent Subtopic", items: [subtopic.title] },
            {
              label: "Quizzes to Delete",
              items: selectedList.map((q) => `${q.title} (${q._count?.questions || 0} questions)`),
            },
          ]}
          consequenceMessage={`This will permanently delete all ${selectedQuizIds.length} selected quizzes, all their questions, and user score history.`}
        />
      ),
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/admin/quizzes/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedQuizIds }),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || "Bulk delete failed");
          }
          soundEffects.playCorrectSound();
          setSelectedQuizIds([]);
          await refreshQuizzes();
          toast.addToast({
            type: "success",
            message: `Successfully deleted ${selectedList.length} quizzes.`,
          });
        } catch (err) {
          console.error(err);
          toast.addToast({ type: "error", message: "Failed to delete selected quizzes." });
        } finally {
          setLoading(false);
        }
      },
    });
  }, [dialog, selectedQuizIds, subtopic.quizzes, subtopic.title, refreshQuizzes, toast]);

  /**
   * Deletes a single quiz.
   */
  const handleDelete = useCallback(
    (quiz: SubtopicQuizItem) => {
      dialog.confirm({
        title: "Delete Quiz",
        okText: "Delete Quiz",
        okVariant: "danger",
        body: (
          <DeleteConfirmDialogBody
            title={quiz.title}
            itemType="Quiz"
            linkSummaries={[
              { label: "Parent Subtopic", items: [subtopic.title] },
              { label: "Questions Count", items: quiz._count?.questions || 0 },
              { label: "User Attempts", items: quiz._count?.attempts || 0 },
            ]}
            consequenceMessage="This will unlink the quiz from all topics, delete its questions and score attempts, and permanently delete the quiz record."
          />
        ),
        onConfirm: async () => {
          setLoading(true);
          const res = await api.delete(`/api/admin/quizzes/${quiz.id}`);
          if (res.success) {
            await refreshQuizzes();
            toast.addToast({ type: "success", message: "Quiz deleted" });
          } else {
            setError(res.error || "Failed to delete quiz");
          }
          setLoading(false);
        },
      });
    },
    [dialog, subtopic.title, refreshQuizzes, toast]
  );

  return (
    <div className="flex flex-col gap-6 py-4 w-full relative">
      {error && (
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Back navigation & breadcrumbs */}
      <div className="flex flex-col gap-3 select-none">
        <Button
          variant="ghost"
          onClick={() => {
            if (parentTopic) {
              router.push(`/admin/manage/topics/${parentTopic.id}/subtopics`);
            } else {
              router.push("/admin/manage/subtopics");
            }
          }}
          className="w-fit gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{parentTopic ? `Back to ${parentTopic.title}` : "Back to Sub Topics"}</span>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
          {parentTopic && (
            <>
              <span
                onClick={() => router.push(`/admin/manage/topics/${parentTopic.id}/subtopics`)}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                {parentTopic.title}
              </span>
              <span>/</span>
            </>
          )}
          <span
            onClick={() => router.push("/admin/manage/subtopics")}
            className="hover:text-foreground cursor-pointer transition-colors"
          >
            Sub Topics
          </span>
          <span>/</span>
          <span className="text-foreground">{subtopic.title}</span>
          <span>/</span>
          <span>Quizzes</span>
        </div>
      </div>

      {/* Header section */}
      <PageHeader
        title={`${subtopic.title} · Quizzes`}
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
            {totalItems}
          </Badge>
        }
        description={
          subtopic.description ||
          "Manage quizzes belonging to this subtopic. Select multiple quizzes to bulk delete or unlink."
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {selectedQuizIds.length >= 2 && (
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 font-semibold text-xs h-9 px-3.5 shadow-xs"
                onClick={handleOpenMergeDialog}
              >
                <GitMerge className="h-3.5 w-3.5" />
                <span>Merge ({selectedQuizIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-3.5"
              onClick={handleOpenBatchQueue}
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Batch Queue</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-3.5"
              onClick={handleOpenLinkDialog}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link Existing Quiz</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
              onClick={handleOpenGenerateQuiz}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Quiz</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9 h-10 w-full"
        />
      </div>

      {/* Main Table or Empty State */}
      {subtopic.quizzes.length === 0 ? (
        <NoData
          title="No Quizzes in this Subtopic"
          description="Generate a quiz using AI or link an existing quiz to populate this subtopic."
          icon="warning"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 font-semibold text-xs h-9 px-3.5" onClick={handleOpenLinkDialog}>
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Link Existing</span>
              </Button>
              <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenGenerateQuiz}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Quiz</span>
              </Button>
            </div>
          }
        />
      ) : (
        <Card className="border-border/80 shadow-xs overflow-hidden p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
                  <th scope="col" className="py-3.5 px-3 font-bold w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center mx-auto"
                      title={isAllCurrentPageSelected ? "Deselect Page" : "Select Page"}
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="py-3.5 px-3 font-bold w-14 text-center">Order</th>
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Difficulty</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Questions</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Attempts</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuizzes.map((quiz) => {
                  const isSelected = selectedQuizIds.includes(quiz.id);
                  return (
                    <tr
                      key={quiz.id}
                      className={cn(
                        "border-b border-border/20 hover:bg-secondary/20 transition-colors",
                        isSelected && "bg-primary/5 dark:bg-primary/10"
                      )}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelectQuiz(quiz.id)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-muted-foreground">
                        #{quiz.quizOrder || 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <button
                          onClick={() => router.push(`/admin/manage/quizzes/${quiz.id}/questions`)}
                          className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1.5 group"
                        >
                          <span>{quiz.title}</span>
                          <span className="text-[11px] text-muted-foreground group-hover:text-primary font-normal">
                            &rarr;
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center select-none">
                        <Badge
                          variant={difficultyColor(quiz.difficulty)}
                          className="capitalize font-bold text-[10px] px-2 py-0.5 animate-none"
                        >
                          {quiz.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-foreground/90">
                        {quiz._count?.questions ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-foreground/90">
                        {quiz._count?.attempts ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/manage/quizzes/${quiz.id}/questions`)}
                            title="Manage Questions"
                            className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </Button>

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
                            <DropdownContent align="right" className="w-52">
                              <DropdownItem onClick={() => router.push(`/admin/manage/quizzes/${quiz.id}/questions`)}>
                                Manage Questions
                              </DropdownItem>
                              <DropdownItem onClick={() => handleOpenEditQuiz(quiz)}>
                                Edit Settings
                              </DropdownItem>
                              <DropdownItem onClick={() => handleUnlink(quiz)} className="text-warning">
                                <span className="flex items-center gap-2">
                                  <Unlink className="h-3.5 w-3.5" />
                                  <span>Unlink from Subtopic</span>
                                </span>
                              </DropdownItem>
                              <DropdownItem onClick={() => handleDelete(quiz)} className="text-danger">
                                Delete Quiz
                              </DropdownItem>
                            </DropdownContent>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* Floating Bottom Multi-Select Action Bar */}
      <FloatingActionBar
        isOpen={selectedQuizIds.length > 0}
        count={selectedQuizIds.length}
        subtitle="Manage subtopic quizzes"
        onClear={handleClearSelection}
      >
        {selectedQuizIds.length >= 2 && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenMergeDialog}
            disabled={loading}
            className="flex-1 sm:flex-none h-8.5 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            title="Merge selected quizzes into 1 quiz"
          >
            <GitMerge className="h-3.5 w-3.5 shrink-0" />
            <span>Merge ({selectedQuizIds.length})</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkUnlink}
          disabled={loading}
          className="flex-1 sm:flex-none h-8.5 px-3 text-xs font-semibold gap-1.5 text-warning hover:text-warning"
          title="Unlink selected quizzes from this subtopic"
        >
          <Unlink className="h-3.5 w-3.5 shrink-0" />
          <span>Unlink</span>
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={handleBulkDelete}
          disabled={loading}
          className="flex-1 sm:flex-none h-8.5 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          title="Delete selected quizzes permanently"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          <span>Delete</span>
        </Button>
      </FloatingActionBar>
    </div>
  );
}

export default SubtopicQuizzesManager;

