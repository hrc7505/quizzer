"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Text, Button, Badge, Input, Card, Spinner,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  Popover, PopoverTrigger, PopoverSurface, Field, Select,
  DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridBody, DataGridCell,
  Tooltip
} from "@fluentui/react-components";
import {
  Brain20Regular, Delete20Regular, ArrowSync20Regular, Eye20Regular,
  Filter20Regular, Dismiss20Regular
} from "@fluentui/react-icons";
import { createTableColumn, TableColumnDefinition } from "@fluentui/react-components";
import { LinkButton } from "@/components/ui/LinkButton";
import NoData from "@/components/feedback/NoData";
import { difficultyColor } from "@/lib/format";
import { useAdminDeepDivesManagerStyles } from "./styles/useAdminDeepDivesManagerStyles";

interface QuestionRecord {
  id: string;
  text: string;
  correctAnswer: string;
  elaboration: string | null;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface AdminDeepDivesManagerProps {
  /** All questions with saved elaborations, fetched server-side. */
  questions: QuestionRecord[];
}

/**
 * AdminDeepDivesManager — full management table for saved AI elaborations.
 * Supports per-item regenerate/delete, bulk delete-all, search, and pagination.
 */
export function AdminDeepDivesManager({ questions: initialQuestions }: AdminDeepDivesManagerProps) {
  const styles = useAdminDeepDivesManagerStyles();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRecord[]>(initialQuestions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic.title))).sort();

  const filtered = questions.filter(q => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.quiz?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !topicFilter || q.topic.title === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRegenerate = async (q: QuestionRecord) => {
    setLoadingId(q.id);
    try {
      const res = await fetch("/api/admin/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, force: true })
      });
      const json = await res.json();
      if (json.success) {
        setQuestions(prev => prev.map(item =>
          item.id === q.id ? { ...item, elaboration: json.markdown } : item
        ));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = (q: QuestionRecord) => {
    triggerConfirm(
      "Delete Elaboration",
      `Are you sure you want to delete the saved Deep Dive for "${q.text.slice(0, 60)}…"? It will be regenerated from AI the next time it is requested.`,
      async () => {
        setLoadingId(q.id);
        await fetch("/api/admin/elaborate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: q.id })
        });
        setQuestions(prev => prev.filter(item => item.id !== q.id));
      }
    );
  };

  const handleBulkDelete = () => {
    triggerConfirm(
      "Delete All Deep Dives",
      `Are you sure you want to permanently delete all ${questions.length} saved elaborations? They will be regenerated fresh on next request.`,
      async () => {
        setLoadingId("bulk");
        await fetch("/api/admin/elaborate/all", { method: "DELETE" });
        setQuestions([]);
      }
    );
  };

  const columns: TableColumnDefinition<QuestionRecord>[] = [
    createTableColumn<QuestionRecord>({
      columnId: "question",
      compare: (a, b) => a.text.localeCompare(b.text),
      renderHeaderCell: () => "Question",
      renderCell: (item) => (
        <Text size={200} className={styles.questionCell}>
          {item.text}
        </Text>
      )
    }),
    createTableColumn<QuestionRecord>({
      columnId: "topic",
      compare: (a, b) => a.topic.title.localeCompare(b.topic.title),
      renderHeaderCell: () => "Topic",
      renderCell: (item) => (
        <Text size={200} className={styles.topicCell}>{item.topic.title}</Text>
      )
    }),
    createTableColumn<QuestionRecord>({
      columnId: "quiz",
      renderHeaderCell: () => "Quiz",
      renderCell: (item) => item.quiz ? (
        <div className={styles.quizCellColumn}>
          <Text size={100} className={styles.quizTitle}>{item.quiz.title}</Text>
          <Badge appearance="filled" color={difficultyColor(item.quiz.difficulty)} className={styles.quizBadge}>
            {item.quiz.difficulty}
          </Badge>
        </div>
      ) : <Text size={100} className={styles.quizUnlinked}>Unlinked</Text>
    }),
    createTableColumn<QuestionRecord>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (item) => (
        <div className={styles.actionsCell}>
          <Tooltip content="View full page" relationship="label">
            <LinkButton href={`/deep-dives/${item.id}`} size="small" appearance="outline" icon={<Eye20Regular />} />
          </Tooltip>
          <Tooltip content="Regenerate with AI" relationship="label">
            <Button
              size="small"
              appearance="outline"
              icon={loadingId === item.id ? <Spinner size="tiny" /> : <ArrowSync20Regular />}
              onClick={() => handleRegenerate(item)}
              disabled={!!loadingId}
            />
          </Tooltip>
          <Tooltip content="Delete elaboration" relationship="label">
            <Button
              size="small"
              appearance="subtle"
              icon={loadingId === item.id ? <Spinner size="tiny" /> : <Delete20Regular />}
              className={styles.deleteActionButton}
              onClick={() => handleDelete(item)}
              disabled={loadingId === item.id || loadingId === "bulk"}
            />
          </Tooltip>
        </div>
      )
    })
  ];

  return (
    <div className={styles.pageRoot}>

      {/* Page header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconContainer}>
            <Brain20Regular className={styles.headerIcon} />
          </div>
          <div>
            <Text size={700} weight="bold" className={styles.headerTitle}>
              Deep Dives
              <Badge appearance="filled" color="informative" className={styles.headerCountBadge}>
                {questions.length}
              </Badge>
            </Text>
            <Text size={200} className={styles.headerSubtitle}>Manage saved AI elaborations</Text>
          </div>
        </div>

        <div className={styles.headerRight}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface className={styles.popoverSurface}>
              <Text size={300} weight="semibold">Search & Filter</Text>
              <Field label="Search">
                <Input
                  placeholder="Question, topic, quiz…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </Field>
              <Field label="Topic">
                <Select
                  value={topicFilter}
                  onChange={e => { setTopicFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">All Topics</option>
                  {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </PopoverSurface>
          </Popover>

          {questions.length > 0 && (
            <Button
              size="small"
              appearance="outline"
              icon={loadingId === "bulk" ? <Spinner size="tiny" /> : <Delete20Regular />}
              className={styles.bulkDeleteButton}
              onClick={handleBulkDelete}
              disabled={loadingId === "bulk"}
            >
              {loadingId === "bulk" ? "Deleting..." : "Delete All"}
            </Button>
          )}

          <LinkButton href="/deep-dives" size="small" appearance="primary" icon={<Eye20Regular />}>
            View Public Library
          </LinkButton>
        </div>
      </div>

      {/* Empty state */}
      {questions.length === 0 ? (
        <NoData 
          title="No Saved Deep Dives" 
          description="Elaborations appear here once users generate them via the 🤖 AI Deep Dive button in quiz results." 
          icon="brain" 
        />
      ) : (
        <Card className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <DataGrid items={paginated} columns={columns} className={styles.dataGrid}>
              <DataGridHeader className={styles.dataGridHeader}>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell className={styles.dataGridHeaderCell}>
                      {renderHeaderCell()}
                    </DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<QuestionRecord>>
                {({ item, rowId }) => (
                  <DataGridRow<QuestionRecord> key={rowId} className={styles.dataGridRow}>
                    {({ renderCell }) => (
                      <DataGridCell className={styles.dataGridCell}>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </div>

          {/* Pagination footer */}
          <div className={styles.paginationFooter}>
            <div className={styles.paginationLeft}>
              <Text size={200} className={styles.paginationLabel}>Show</Text>
              <Select value={pageSize.toString()} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} size="small" className={styles.pageSizeSelect}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <Text size={200} className={styles.paginationLabel}>entries</Text>
            </div>
            <Text size={200} className={styles.paginationRange}>
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </Text>
            <div className={styles.paginationButtons}>
              <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(_, d) => setConfirmDialog(p => ({ ...p, open: d.open }))}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {confirmDialog.title}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Text className={styles.dialogText}>
                {confirmDialog.description}
              </Text>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                className={styles.dialogConfirmButton}
                onClick={async () => {
                  await confirmDialog.onConfirm();
                  setConfirmDialog(p => ({ ...p, open: false }));
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

    </div>
  );
}
