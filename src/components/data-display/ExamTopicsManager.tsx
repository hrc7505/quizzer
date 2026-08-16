"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Search, Link as LinkIcon, MoreHorizontal, Unlink, Layers } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/data-display/PageHeader";
import { Pagination } from "@/components/data-display/Pagination";
import { NoData } from "@/components/feedback/NoData";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { TopicDialogBody } from "@/components/data-display/TaxonomyDialogBodies";
import { DeleteConfirmDialogBody } from "@/components/feedback/DeleteConfirmDialogBody";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { useDialog } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api } from "@/lib/api";

import type {
  ExamTopicsManagerProps,
  ExamTopicItem,
  ExamWithTopics,
} from "@/components/data-display/interfaces/ExamTopicsManager.interface";

/**
 * ExamTopicsManager component.
 * Manages the list of Main Topics specifically belonging to an Exam.
 * Supports direct topic creation under the exam (auto-linked), linking existing standalone topics,
 * contextual unlinking from the exam, and safe deletion.
 */
export function ExamTopicsManager({
  exam: initialExam,
  availableStandaloneTopics = [],
}: ExamTopicsManagerProps) {
  const router = useRouter();
  const dialog = useDialog();
  const toast = useToast();

  const [exam, setExam] = useState<ExamWithTopics>(initialExam);
  const [standaloneTopics, setStandaloneTopics] = useState<ExamTopicItem[]>(availableStandaloneTopics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Linking state
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const selectedTopicIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedTopicIdsRef.current = selectedTopicIds;
  }, [selectedTopicIds]);

  /**
   * Refreshes the exam's topics from the server.
   */
  const refreshTopics = useCallback(async () => {
    try {
      const res = await api.get<ExamTopicItem[]>(`/api/admin/topics?examId=${exam.id}`);
      if (res.success && res.data) {
        setExam((prev) => ({ ...prev, topics: res.data || [] }));
      }
      const allRes = await api.get<ExamTopicItem[]>("/api/admin/topics?all=false");
      if (allRes.success && allRes.data) {
        setStandaloneTopics(allRes.data.filter((t) => !t.exams?.some((e) => e.id === exam.id)));
      }
    } catch (e) {
      console.error("Failed to refresh topics:", e);
    }
  }, [exam.id]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return exam.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [exam.topics, searchQuery]);

  const totalItems = filteredTopics.length;
  const paginatedTopics = useMemo(() => {
    return filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTopics, currentPage, pageSize]);

  /**
   * Directly creates a new main topic under this exam.
   */
  const handleOpenAddTopic = useCallback(() => {
    setError(null);
    dialog.open({
      title: `Add Main Topic to ${exam.title}`,
      body: (
        <TopicDialogBody
          initialForm={{ id: "", title: "", description: "", examId: exam.id, parentId: "" }}
          onSave={async (form) => {
            setLoading(true);
            const res = await api.post("/api/admin/topics", {
              title: form.title,
              description: form.description,
              examId: exam.id,
            });
            if (res.success) {
              await refreshTopics();
              toast.addToast({ type: "success", message: "Main topic added to exam" });
              dialog.close();
            } else {
              setError(res.error || "Failed to add topic");
            }
            setLoading(false);
          }}
          loading={loading}
        />
      ),
    });
  }, [dialog, exam.id, exam.title, refreshTopics, toast, loading]);

  /**
   * Opens the Link Existing Topics dialog.
   */
  const handleOpenLinkDialog = useCallback(() => {
    setSelectedTopicIds(exam.topics.map((t) => t.id));
    dialog.open({
      title: "Link Existing Main Topics",
      showClose: false,
      body: (
        <LinkPicker
          description={`Select existing standalone main topics to associate with ${exam.title}.`}
          label="Main Topics"
          placeholder="Search topics..."
          items={standaloneTopics}
          selectedIds={selectedTopicIds}
          onSelectionChange={setSelectedTopicIds}
          selectionRef={selectedTopicIdsRef}
          emptyHint="No unlinked standalone topics available. You can create a new topic directly."
        />
      ),
      okText: "Save Links",
      onOk: async () => {
        setLoading(true);
        const idsToSave = selectedTopicIdsRef.current;
        const res = await api.post(`/api/admin/exams/${exam.id}/link-topics`, { topicIds: idsToSave });
        if (res.success) {
          await refreshTopics();
          toast.addToast({ type: "success", message: "Topics linked to exam" });
        } else {
          setError(res.error || "Failed to link topics");
        }
        setLoading(false);
      },
    });
  }, [dialog, exam.title, exam.id, exam.topics, standaloneTopics, selectedTopicIds, refreshTopics, toast]);

  /**
   * Unlinks a topic from this exam only.
   */
  const handleUnlink = useCallback(
    (topic: ExamTopicItem) => {
      dialog.confirm({
        title: "Unlink Topic from Exam",
        description: `Are you sure you want to unlink "${topic.title}" from "${exam.title}"? The topic, its subtopics, and quizzes will remain in the database.`,
        okText: "Unlink",
        onConfirm: async () => {
          setLoading(true);
          const res = await api.post(`/api/admin/topics/${topic.id}/unlink-exam?examId=${exam.id}`);
          if (res.success) {
            await refreshTopics();
            toast.addToast({ type: "success", message: "Topic unlinked from exam" });
          } else {
            setError(res.error || "Failed to unlink topic");
          }
          setLoading(false);
        },
      });
    },
    [dialog, exam.title, exam.id, refreshTopics, toast]
  );

  /**
   * Deletes a topic after showing all link details.
   */
  const handleDelete = useCallback(
    (topic: ExamTopicItem) => {
      dialog.confirm({
        title: "Delete Topic",
        okText: "Delete Topic",
        okVariant: "danger",
        body: (
          <DeleteConfirmDialogBody
            title={topic.title}
            itemType="Main Topic"
            linkSummaries={[
              { label: "Parent Exam", items: [exam.title] },
              { label: "Sub Topics", items: topic.subtopics?.map((s) => s.title) || topic._count?.subtopics || 0 },
              { label: "Quizzes", items: topic.quizzes?.map((q) => q.title) || topic._count?.quizzes || 0 },
            ]}
            consequenceMessage="This will unlink the topic from this Exam, unlink its subtopics and quizzes, and permanently delete the topic record."
          />
        ),
        onConfirm: async () => {
          setLoading(true);
          const res = await api.delete(`/api/admin/topics/${topic.id}`);
          if (res.success) {
            await refreshTopics();
            toast.addToast({ type: "success", message: "Topic deleted" });
          } else {
            setError(res.error || "Failed to delete topic");
          }
          setLoading(false);
        },
      });
    },
    [dialog, exam.title, refreshTopics, toast]
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
          onClick={() => router.push("/admin/manage/exams")}
          className="w-fit gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Exams</span>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
          <span
            onClick={() => router.push("/admin/manage/exams")}
            className="hover:text-foreground cursor-pointer transition-colors"
          >
            Exams
          </span>
          <span>/</span>
          <span className="text-foreground">{exam.title}</span>
          <span>/</span>
          <span>Main Topics</span>
        </div>
      </div>

      {/* Header section */}
      <PageHeader
        title={`${exam.title} · Main Topics`}
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
            {totalItems}
          </Badge>
        }
        description={
          exam.description || "Manage main topics linked to this exam. Click on any topic to manage its subtopics."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-3.5"
              onClick={handleOpenLinkDialog}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link Existing Topic</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
              onClick={handleOpenAddTopic}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Main Topic</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search main topics in this exam..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9 h-10 w-full"
        />
      </div>

      {/* Main Table or Empty State */}
      {exam.topics.length === 0 ? (
        <NoData
          title="No Main Topics in this Exam"
          description="Add a new main topic or link an existing standalone topic to start structuring this exam."
          icon="warning"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 font-semibold text-xs h-9 px-3.5" onClick={handleOpenLinkDialog}>
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Link Existing</span>
              </Button>
              <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAddTopic}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Main Topic</span>
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
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Topic Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Description</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-28">Subtopics</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-28">Quizzes</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTopics.map((topic) => (
                  <tr key={topic.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <button
                        onClick={() => router.push(`/admin/manage/topics/${topic.id}/subtopics`)}
                        className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1.5 group"
                      >
                        <span>{topic.title}</span>
                        <span className="text-[11px] text-muted-foreground group-hover:text-primary font-normal">
                          &rarr;
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-xs">
                      {topic.description || "No description provided."}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-foreground/90">
                      {topic.subtopics?.length ?? topic._count?.subtopics ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-foreground/90">
                      {topic.quizzes?.length ?? topic._count?.quizzes ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/manage/topics/${topic.id}/subtopics`)}
                          title="View Subtopics"
                          className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                        >
                          <Layers className="h-3.5 w-3.5" />
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
                          <DropdownContent align="right" className="w-48">
                            <DropdownItem onClick={() => router.push(`/admin/manage/topics/${topic.id}/subtopics`)}>
                              Manage Subtopics
                            </DropdownItem>
                            <DropdownItem onClick={() => handleUnlink(topic)} className="text-warning">
                              <span className="flex items-center gap-2">
                                <Unlink className="h-3.5 w-3.5" />
                                <span>Unlink from Exam</span>
                              </span>
                            </DropdownItem>
                            <DropdownItem onClick={() => handleDelete(topic)} className="text-danger">
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

export default ExamTopicsManager;
