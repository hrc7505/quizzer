"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Search, Link as LinkIcon, MoreHorizontal, Unlink, Sparkles, HelpCircle, Layers } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/data-display/PageHeader";
import { Pagination } from "@/components/data-display/Pagination";
import { NoData } from "@/components/feedback/NoData";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { EditQuizDialogBody, type QuizFormState } from "@/components/data-display/QuizManagerBodies";
import { DeleteConfirmDialogBody } from "@/components/feedback/DeleteConfirmDialogBody";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { useDialog } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { BatchQueueManager } from "@/components/data-display/BatchQueueManager";
import { difficultyColor } from "@/lib/format";
import { api } from "@/lib/api";

import type {
  SubtopicQuizzesManagerProps,
  SubtopicQuizItem,
  SubtopicWithQuizzes,
} from "@/components/data-display/interfaces/SubtopicQuizzesManager.interface";

/**
 * SubtopicQuizzesManager component.
 * Manages the list of Quizzes attached to a specific Subtopic.
 * Supports direct AI quiz generation (auto-linked to subtopic), manual creation,
 * linking existing quizzes, contextual unlinking from the subtopic, and safe deletion.
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

  // Linking state
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const selectedQuizIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedQuizIdsRef.current = selectedQuizIds;
  }, [selectedQuizIds]);

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

  const parentTopic = subtopic.parentTopics?.[0];

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
          onSuccess={async () => {
            await refreshQuizzes();
            dialog.close();
            toast.addToast({ type: "success", message: "Quiz generated successfully" });
          }}
        />
      ),
    });
  }, [dialog, subtopic.id, subtopic.title, refreshQuizzes, toast]);

  /**
   * Opens the Batch Queue dialog panel for this subtopic.
   */
  const handleOpenBatchQueue = useCallback(() => {
    dialog.open({
      title: `Batch Queue - "${subtopic.title}"`,
      showClose: true,
      body: (
        <div className="p-1">
          <BatchQueueManager initialTopicId={subtopic.id} />
        </div>
      ),
    });
  }, [dialog, subtopic.id, subtopic.title]);

  /**
   * Opens the Link Existing Quizzes dialog.
   */
  const handleOpenLinkDialog = useCallback(() => {
    setSelectedQuizIds(subtopic.quizzes.map((q) => q.id));
    dialog.open({
      title: "Link Existing Quizzes",
      showClose: false,
      body: (
        <LinkPicker
          description={`Select existing quizzes to link to "${subtopic.title}".`}
          label="Quizzes"
          placeholder="Search quizzes..."
          items={unlinkedQuizzes}
          selectedIds={selectedQuizIds}
          onSelectionChange={setSelectedQuizIds}
          selectionRef={selectedQuizIdsRef}
          emptyHint="No unlinked quizzes found. You can generate a new quiz directly."
        />
      ),
      okText: "Save Links",
      onOk: async () => {
        setLoading(true);
        const idsToSave = selectedQuizIdsRef.current;
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
  }, [dialog, subtopic.title, subtopic.id, subtopic.quizzes, unlinkedQuizzes, selectedQuizIds, refreshQuizzes, toast]);

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
   * Deletes a quiz after displaying all link details.
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
    <div className="flex flex-col gap-6 py-4 w-full">
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
          "Manage quizzes belonging to this subtopic. Click on any quiz to inspect and manage its questions."
        }
        actions={
          <div className="flex items-center gap-2">
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
                  <th scope="col" className="py-3.5 px-4 font-bold w-16 text-center">Order</th>
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Difficulty</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Questions</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Attempts</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-muted-foreground">
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
                ))}
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
    </div>
  );
}

export default SubtopicQuizzesManager;
