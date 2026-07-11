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
  Filter20Regular, Dismiss20Regular, Warning48Regular
} from "@fluentui/react-icons";
import { createTableColumn, TableColumnDefinition } from "@fluentui/react-components";
import Link from "next/link";

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

  const difficultyColor = (d: string): "success" | "warning" | "danger" =>
    d === "Easy" ? "success" : d === "Hard" ? "danger" : "warning";

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
        <Text size={200} style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          color: "#1f2937",
          lineHeight: "1.4"
        }}>
          {item.text}
        </Text>
      )
    }),
    createTableColumn<QuestionRecord>({
      columnId: "topic",
      compare: (a, b) => a.topic.title.localeCompare(b.topic.title),
      renderHeaderCell: () => "Topic",
      renderCell: (item) => (
        <Text size={200} style={{ color: "#6b7280" }}>{item.topic.title}</Text>
      )
    }),
    createTableColumn<QuestionRecord>({
      columnId: "quiz",
      renderHeaderCell: () => "Quiz",
      renderCell: (item) => item.quiz ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Text size={100} style={{ color: "#374151" }}>{item.quiz.title}</Text>
          <Badge appearance="filled" color={difficultyColor(item.quiz.difficulty)} style={{ width: "fit-content" }}>
            {item.quiz.difficulty}
          </Badge>
        </div>
      ) : <Text size={100} style={{ color: "#9ca3af", fontStyle: "italic" }}>Unlinked</Text>
    }),
    createTableColumn<QuestionRecord>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (item) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <Tooltip content="View full page" relationship="label">
            <Link href={`/deep-dives/${item.id}`} style={{ textDecoration: "none" }}>
              <Button size="small" appearance="outline" icon={<Eye20Regular />} />
            </Link>
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
              style={{ color: "#d13438" }}
              onClick={() => handleDelete(item)}
              disabled={loadingId === item.id || loadingId === "bulk"}
            />
          </Tooltip>
        </div>
      )
    })
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Brain20Regular style={{ color: "white", fontSize: "24px" }} />
          </div>
          <div>
            <Text size={700} weight="bold" style={{ color: "#1a1a2e", display: "block" }}>
              Deep Dives
              <Badge appearance="filled" color="informative" style={{ marginLeft: "10px", borderRadius: "12px" }}>
                {questions.length}
              </Badge>
            </Text>
            <Text size={200} style={{ color: "#6b7280" }}>Manage saved AI elaborations</Text>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface style={{ width: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
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
              style={{ color: "#d13438", borderColor: "#d13438" }}
              onClick={handleBulkDelete}
              disabled={loadingId === "bulk"}
            >
              {loadingId === "bulk" ? "Deleting..." : "Delete All"}
            </Button>
          )}

          <Link href="/deep-dives" style={{ textDecoration: "none" }}>
            <Button size="small" appearance="primary" icon={<Eye20Regular />}>
              View Public Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {questions.length === 0 ? (
        <div style={{
          display: "flex", justifyContent: "center", padding: "60px 0"
        }}>
          <Card style={{
            borderRadius: "16px", padding: "48px",
            textAlign: "center", border: "1px dashed #d1d5db",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
            maxWidth: "520px", width: "100%"
          }}>
            <Warning48Regular style={{ color: "#667eea" }} />
            <Text size={500} weight="bold" block style={{ color: "#374151" }}>No Saved Deep Dives</Text>
            <Text size={300} style={{ color: "#6b7280" }}>
              Elaborations appear here once users generate them via the 🤖 AI Deep Dive button in quiz results.
            </Text>
          </Card>
        </div>
      ) : (
        <Card style={{
          borderRadius: "14px", border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)", overflow: "hidden", padding: 0
        }}>
          <div style={{ overflowX: "auto" }}>
            <DataGrid items={paginated} columns={columns} style={{ minWidth: "800px" }}>
              <DataGridHeader style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #eaeaea" }}>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell style={{ padding: "12px 16px", fontWeight: "bold" }}>
                      {renderHeaderCell()}
                    </DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<QuestionRecord>>
                {({ item, rowId }) => (
                  <DataGridRow<QuestionRecord> key={rowId} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    {({ renderCell }) => (
                      <DataGridCell style={{ padding: "14px 16px" }}>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          </div>

          {/* Pagination footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderTop: "1px solid #eaeaea", backgroundColor: "#fafafa",
            flexWrap: "wrap", gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text size={200} style={{ color: "#6b7280" }}>Show</Text>
              <Select value={pageSize.toString()} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} size="small" style={{ width: "80px" }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <Text size={200} style={{ color: "#6b7280" }}>entries</Text>
            </div>
            <Text size={200} style={{ color: "#6b7280" }}>
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </Text>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(_, d) => setConfirmDialog(p => ({ ...p, open: d.open }))}>
        <DialogSurface style={{ borderRadius: "12px", padding: "24px", maxWidth: "420px" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {confirmDialog.title}
            </DialogTitle>
            <DialogContent style={{ paddingTop: "12px" }}>
              <Text style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                {confirmDialog.description}
              </Text>
            </DialogContent>
            <DialogActions style={{ marginTop: "24px" }}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                style={{ backgroundColor: "#d13438", borderColor: "#d13438", color: "#fff" }}
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
