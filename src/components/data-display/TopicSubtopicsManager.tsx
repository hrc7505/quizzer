"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Search, Link as LinkIcon, MoreHorizontal, Unlink, HelpCircle } from "lucide-react";

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
  TopicSubtopicsManagerProps,
  SubtopicItem,
  TopicWithSubtopics,
} from "@/components/data-display/interfaces/TopicSubtopicsManager.interface";

/**
 * TopicSubtopicsManager component.
 * Manages the list of Subtopics nested under a specific Main Topic.
 * Supports direct subtopic creation (auto-linked to parent), linking existing subtopics,
 * contextual unlinking from the parent topic, and safe deletion.
 */
export function TopicSubtopicsManager({
  topic: initialTopic,
  availableSubtopics = [],
}: TopicSubtopicsManagerProps) {
  const router = useRouter();
  const dialog = useDialog();
  const toast = useToast();

  const [topic, setTopic] = useState<TopicWithSubtopics>(initialTopic);
  const [unlinkedSubtopics, setUnlinkedSubtopics] = useState<SubtopicItem[]>(availableSubtopics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Linking state
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const selectedSubtopicIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedSubtopicIdsRef.current = selectedSubtopicIds;
  }, [selectedSubtopicIds]);

  /**
   * Refreshes the subtopics from the server.
   */
  const refreshSubtopics = useCallback(async () => {
    try {
      const res = await api.get<SubtopicItem[]>(`/api/admin/topics?parentId=${topic.id}`);
      if (res.success && res.data) {
        setTopic((prev) => ({ ...prev, subtopics: res.data || [] }));
      }
      const allRes = await api.get<SubtopicItem[]>("/api/admin/topics?all=true");
      if (allRes.success && allRes.data) {
        // Exclude self and already linked subtopics
        setUnlinkedSubtopics(
          allRes.data.filter(
            (t) => t.id !== topic.id && !t.parentTopics?.some((p) => p.id === topic.id)
          )
        );
      }
    } catch (e) {
      console.error("Failed to refresh subtopics:", e);
    }
  }, [topic.id]);

  // Filtered subtopics
  const filteredSubtopics = useMemo(() => {
    return topic.subtopics.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [topic.subtopics, searchQuery]);

  const totalItems = filteredSubtopics.length;
  const paginatedSubtopics = useMemo(() => {
    return filteredSubtopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredSubtopics, currentPage, pageSize]);

  const parentExam = topic.exams?.[0];

  /**
   * Directly creates a new subtopic nested under this main topic.
   */
  const handleOpenAddSubtopic = useCallback(() => {
    setError(null);
    dialog.open({
      title: `Add Sub Topic to ${topic.title}`,
      body: (
        <TopicDialogBody
          initialForm={{ id: "", title: "", description: "", examId: "", parentId: topic.id }}
          onSave={async (form) => {
            setLoading(true);
            const res = await api.post("/api/admin/topics", {
              title: form.title,
              description: form.description,
              parentId: topic.id,
            });
            if (res.success) {
              await refreshSubtopics();
              toast.addToast({ type: "success", message: "Sub topic added successfully" });
              dialog.close();
            } else {
              setError(res.error || "Failed to add subtopic");
            }
            setLoading(false);
          }}
          loading={loading}
        />
      ),
    });
  }, [dialog, topic.id, topic.title, refreshSubtopics, toast, loading]);

  /**
   * Opens the Link Existing Subtopics dialog.
   */
  const handleOpenLinkDialog = useCallback(() => {
    setSelectedSubtopicIds(topic.subtopics.map((s) => s.id));
    dialog.open({
      title: "Link Existing Sub Topics",
      showClose: false,
      body: (
        <LinkPicker
          description={`Select existing subtopics to nest under "${topic.title}".`}
          label="Subtopics"
          placeholder="Search subtopics..."
          items={unlinkedSubtopics}
          selectedIds={selectedSubtopicIds}
          onSelectionChange={setSelectedSubtopicIds}
          selectionRef={selectedSubtopicIdsRef}
          emptyHint="No unlinked subtopics available. You can create a new subtopic directly."
        />
      ),
      okText: "Save Links",
      onOk: async () => {
        setLoading(true);
        const idsToSave = selectedSubtopicIdsRef.current;
        const res = await api.post(`/api/admin/topics/${topic.id}/link-subtopics`, { subtopicIds: idsToSave });
        if (res.success) {
          await refreshSubtopics();
          toast.addToast({ type: "success", message: "Subtopics linked" });
        } else {
          setError(res.error || "Failed to link subtopics");
        }
        setLoading(false);
      },
    });
  }, [dialog, topic.title, topic.id, topic.subtopics, unlinkedSubtopics, selectedSubtopicIds, refreshSubtopics, toast]);

  /**
   * Unlinks a subtopic from this parent topic only.
   */
  const handleUnlink = useCallback(
    (subtopic: SubtopicItem) => {
      dialog.confirm({
        title: "Unlink Subtopic from Parent Topic",
        description: `Are you sure you want to unlink "${subtopic.title}" from "${topic.title}"? The subtopic and its quizzes will remain in the database.`,
        okText: "Unlink",
        onConfirm: async () => {
          setLoading(true);
          const res = await api.post(`/api/admin/topics/${subtopic.id}/unlink-parent?parentId=${topic.id}`);
          if (res.success) {
            await refreshSubtopics();
            toast.addToast({ type: "success", message: "Subtopic unlinked" });
          } else {
            setError(res.error || "Failed to unlink subtopic");
          }
          setLoading(false);
        },
      });
    },
    [dialog, topic.title, topic.id, refreshSubtopics, toast]
  );

  /**
   * Deletes a subtopic after displaying all link details.
   */
  const handleDelete = useCallback(
    (subtopic: SubtopicItem) => {
      dialog.confirm({
        title: "Delete Subtopic",
        okText: "Delete Subtopic",
        okVariant: "danger",
        body: (
          <DeleteConfirmDialogBody
            title={subtopic.title}
            itemType="Sub Topic"
            linkSummaries={[
              { label: "Parent Topic", items: [topic.title] },
              { label: "Quizzes", items: subtopic.quizzes?.map((q) => q.title) || subtopic._count?.quizzes || 0 },
            ]}
            consequenceMessage="This will unlink the subtopic from its parent topic and all quizzes, then permanently delete the subtopic record."
          />
        ),
        onConfirm: async () => {
          setLoading(true);
          const res = await api.delete(`/api/admin/topics/${subtopic.id}`);
          if (res.success) {
            await refreshSubtopics();
            toast.addToast({ type: "success", message: "Subtopic deleted" });
          } else {
            setError(res.error || "Failed to delete subtopic");
          }
          setLoading(false);
        },
      });
    },
    [dialog, topic.title, refreshSubtopics, toast]
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
            if (parentExam) {
              router.push(`/admin/manage/exams/${parentExam.id}/topics`);
            } else {
              router.push("/admin/manage/topics");
            }
          }}
          className="w-fit gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{parentExam ? `Back to ${parentExam.title}` : "Back to Topics"}</span>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
          {parentExam && (
            <>
              <span
                onClick={() => router.push(`/admin/manage/exams/${parentExam.id}/topics`)}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                {parentExam.title}
              </span>
              <span>/</span>
            </>
          )}
          <span
            onClick={() => router.push("/admin/manage/topics")}
            className="hover:text-foreground cursor-pointer transition-colors"
          >
            Main Topics
          </span>
          <span>/</span>
          <span className="text-foreground">{topic.title}</span>
          <span>/</span>
          <span>Sub Topics</span>
        </div>
      </div>

      {/* Header section */}
      <PageHeader
        title={`${topic.title} · Sub Topics`}
        badge={
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
            {totalItems}
          </Badge>
        }
        description={
          topic.description ||
          "Manage subtopics nested under this main topic. Click on any subtopic to view and manage its quizzes."
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
              <span>Link Existing Subtopic</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
              onClick={handleOpenAddSubtopic}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Sub Topic</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search subtopics..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9 h-10 w-full"
        />
      </div>

      {/* Main Table or Empty State */}
      {topic.subtopics.length === 0 ? (
        <NoData
          title="No Sub Topics in this Main Topic"
          description="Create a subtopic or link an existing one to organize quizzes under this topic."
          icon="warning"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 font-semibold text-xs h-9 px-3.5" onClick={handleOpenLinkDialog}>
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Link Existing</span>
              </Button>
              <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={handleOpenAddSubtopic}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Sub Topic</span>
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
                  <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Subtopic Title</th>
                  <th scope="col" className="py-3.5 px-4 font-bold">Description</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-28">Quizzes</th>
                  <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubtopics.map((subtopic) => (
                  <tr key={subtopic.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <button
                        onClick={() => router.push(`/admin/manage/subtopics/${subtopic.id}/quizzes`)}
                        className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1.5 group"
                      >
                        <span>{subtopic.title}</span>
                        <span className="text-[11px] text-muted-foreground group-hover:text-primary font-normal">
                          &rarr;
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-xs">
                      {subtopic.description || "No description provided."}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-foreground/90">
                      {subtopic.quizzes?.length ?? subtopic._count?.quizzes ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/manage/subtopics/${subtopic.id}/quizzes`)}
                          title="View Quizzes"
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
                            <DropdownItem onClick={() => router.push(`/admin/manage/subtopics/${subtopic.id}/quizzes`)}>
                              Manage Quizzes
                            </DropdownItem>
                            <DropdownItem onClick={() => handleUnlink(subtopic)} className="text-warning">
                              <span className="flex items-center gap-2">
                                <Unlink className="h-3.5 w-3.5" />
                                <span>Unlink from Parent Topic</span>
                              </span>
                            </DropdownItem>
                            <DropdownItem onClick={() => handleDelete(subtopic)} className="text-danger">
                              Delete Subtopic
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

export default TopicSubtopicsManager;
