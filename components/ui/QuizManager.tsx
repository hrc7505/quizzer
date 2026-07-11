"use client";

import { useState, useEffect } from "react";
import {
  Text, Button, Badge, Input, Card, Select, Spinner, Field, Textarea, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  Popover, PopoverTrigger, PopoverSurface,
  Combobox, Option,
  DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridBody, DataGridCell,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, Link20Regular, LinkDismiss20Regular,
  Filter20Regular, Dismiss20Regular, MoreHorizontal20Regular,
  DocumentDatabase24Regular, Warning48Regular, BookOpen20Regular,
  Sparkle20Regular
} from "@fluentui/react-icons";
import { createTableColumn, TableColumnDefinition } from "@fluentui/react-components";
import { GenerateQuizForm } from "./GenerateQuizForm";
import { useRouter } from "next/navigation";

interface TopicRef {
  id: string;
  title: string;
  parentTopics?: { id: string }[];
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  topics: TopicRef[];
  _count: { questions: number; attempts: number };
}

interface QuizManagerProps {
  /** All quizzes from DB, pre-fetched server-side. */
  quizzes: Quiz[];
  /** All topics available for linking. */
  topics: TopicRef[];
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

/**
 * QuizManager — full CRUD management table for quizzes.
 * Supports create, edit, delete, link/unlink subtopics, search, filter, paginate.
 */
export function QuizManager({ quizzes: initial, topics }: QuizManagerProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  // Form state
  const [quizForm, setQuizForm] = useState({ id: "", title: "", difficulty: "Medium", quizOrder: "" });
  const [linkQuizId, setLinkQuizId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Detail drawer state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [activeQuizDetail, setActiveQuizDetail] = useState<any | null>(null);
  const [activeQuizLoading, setActiveQuizLoading] = useState(false);

  // Question Form / Dialog State
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // ── Database Actions ────────────────────────────────────────────────────────
  
  const loadQuizDetails = async (id: string) => {
    setActiveQuizLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`);
      const data = await res.json();
      if (!data.error) {
        setActiveQuizDetail(data);
      }
    } catch (e) {
      console.error("Error loading quiz details:", e);
    } finally {
      setActiveQuizLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      loadQuizDetails(selectedQuizId);
    } else {
      setActiveQuizDetail(null);
    }
  }, [selectedQuizId]);

  const handleOpenAddQuestion = () => {
    setQuestionForm({
      id: "",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      hint: "",
      description: ""
    });
    setQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (q: any) => {
    setQuestionForm({
      id: q.id,
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      hint: q.hint || "",
      description: q.description || ""
    });
    setQuestionDialogOpen(true);
  };

  const handleOptionChange = (idx: number, val: string) => {
    setQuestionForm(prev => {
      const newOpts = [...prev.options];
      newOpts[idx] = val;
      let newCorrect = prev.correctAnswer;
      if (prev.correctAnswer === prev.options[idx]) {
        newCorrect = val;
      }
      return { ...prev, options: newOpts, correctAnswer: newCorrect };
    });
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuizId) return;
    setLoading(true);

    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: selectedQuizId,
      text: questionForm.text,
      options: questionForm.options,
      correctAnswer: questionForm.correctAnswer,
      hint: questionForm.hint,
      description: questionForm.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.error) {
        setQuestionDialogOpen(false);
        await loadQuizDetails(selectedQuizId);
        await fetchQuizzes();
      } else {
        alert(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = (questionId: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            if (selectedQuizId) {
              await loadQuizDetails(selectedQuizId);
              await fetchQuizzes();
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Filter / pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  const quizToLink = quizzes.find(q => q.id === linkQuizId);
  const availableSubtopics = topics.filter(t => 
    (t.parentTopics?.length ?? 0) > 0 &&
    (!quizToLink || !quizToLink.topics.some(lt => lt.id === t.id))
  );

  const filtered = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDiff = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchSearch && matchDiff;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const fetchQuizzes = async () => {
    const res = await fetch("/api/admin/quizzes");
    const data = await res.json();
    if (Array.isArray(data)) setQuizzes(data);
  };

  const difficultyColor = (d: string): "success" | "warning" | "danger" =>
    d === "Easy" ? "success" : d === "Hard" ? "danger" : "warning";

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveQuiz = async () => {
    setLoading(true);
    const url = quizForm.id ? `/api/admin/quizzes/${quizForm.id}` : "/api/admin/quizzes";
    const method = quizForm.id ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quizForm.title,
        difficulty: quizForm.difficulty,
        quizOrder: quizForm.quizOrder ? parseInt(quizForm.quizOrder) : undefined
      })
    });
    setQuizDialogOpen(false);
    await fetchQuizzes();
    setLoading(false);
  };

  const handleSaveLinks = async () => {
    if (!linkQuizId) return;
    setLoading(true);
    const quiz = quizzes.find(q => q.id === linkQuizId);
    if (!quiz) return;

    // Connect this quiz to each newly selected subtopic
    for (const topicId of selectedTopicIds) {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) continue;
      await fetch(`/api/admin/quizzes/${linkQuizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          difficulty: quiz.difficulty,
          quizOrder: quiz.quizOrder,
          topicId
        })
      });
    }

    setLinkDialogOpen(false);
    await fetchQuizzes();
    setLoading(false);
  };

  const handleUnlinkTopic = (quizId: string, quizTitle: string, topicId: string, topicTitle: string) => {
    triggerConfirm(
      "Unlink Topic",
      `Unlink "${topicTitle}" from the quiz "${quizTitle}"? The quiz remains; it just won't be associated with this topic.`,
      async () => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        // Set quiz topics to empty for this topic relationship
        await fetch(`/api/admin/quizzes/${quizId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quizTitle,
            difficulty: quizzes.find(q => q.id === quizId)?.difficulty,
            quizOrder: quizzes.find(q => q.id === quizId)?.quizOrder,
            topicId: null
          })
        });
        await fetchQuizzes();
      }
    );
  };

  const handleDelete = (quiz: Quiz) => {
    triggerConfirm(
      "Delete Quiz",
      `Permanently delete "${quiz.title}"? This will also delete all ${quiz._count.questions} questions and ${quiz._count.attempts} attempt records. This cannot be undone.`,
      async () => {
        await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
        setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
        if (selectedQuizId === quiz.id) setSelectedQuizId(null);
      }
    );
  };

  const openGenerateDialog = () => {
    setGenerateDialogOpen(true);
  };

  const openEditDialog = (quiz: Quiz) => {
    setQuizForm({ id: quiz.id, title: quiz.title, difficulty: quiz.difficulty, quizOrder: String(quiz.quizOrder) });
    setQuizDialogOpen(true);
  };

  const openLinkDialog = (quiz: Quiz) => {
    setLinkQuizId(quiz.id);
    setSelectedTopicIds([]);
    setLinkDialogOpen(true);
  };

  // ── Table columns ─────────────────────────────────────────────────────────────

  const columns: TableColumnDefinition<Quiz>[] = [
    createTableColumn<Quiz>({
      columnId: "title",
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => "Quiz Title",
      renderCell: (item) => (
        <Tooltip content="Click to view questions" relationship="label">
          <Button
            appearance="transparent"
            style={{ padding: 0, height: "auto", fontWeight: "bold", color: "#0078d4", textAlign: "left", justifyContent: "flex-start", minWidth: "auto" }}
            onClick={() => router.push(`/admin/manage/quizzes/${item.id}/questions`)}
          >
            {item.title}
          </Button>
        </Tooltip>
      )
    }),
    createTableColumn<Quiz>({
      columnId: "difficulty",
      compare: (a, b) => a.difficulty.localeCompare(b.difficulty),
      renderHeaderCell: () => "Difficulty",
      renderCell: (item) => (
        <Badge appearance="filled" color={difficultyColor(item.difficulty)}>{item.difficulty}</Badge>
      )
    }),
    createTableColumn<Quiz>({
      columnId: "topics",
      renderHeaderCell: () => "Linked Topics",
      renderCell: (item) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {item.topics.length === 0
            ? <Text size={100} style={{ color: "#9ca3af", fontStyle: "italic" }}>Unlinked</Text>
            : item.topics.map(t => (
              <Badge key={t.id} appearance="tint" color="informative" style={{ borderRadius: "6px" }}>{t.title}</Badge>
            ))
          }
        </div>
      )
    }),
    createTableColumn<Quiz>({
      columnId: "stats",
      renderHeaderCell: () => "Stats",
      renderCell: (item) => (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Text size={100} style={{ color: "#374151" }}>#{item.quizOrder}</Text>
          <Text size={100} style={{ color: "#6b7280" }}>{item._count.questions} Qs · {item._count.attempts} attempts</Text>
        </div>
      )
    }),
    createTableColumn<Quiz>({
      columnId: "actions",
      renderHeaderCell: () => "Actions",
      renderCell: (item) => (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small" appearance="subtle" icon={<MoreHorizontal20Regular />} aria-label="More actions" />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Edit20Regular />} onClick={() => openEditDialog(item)}>Edit Quiz</MenuItem>
              <MenuItem icon={<Link20Regular />} onClick={() => openLinkDialog(item)}>Link / Unlink Topics</MenuItem>
              <MenuItem icon={<Delete20Regular />} onClick={() => handleDelete(item)}>Delete Quiz</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )
    })
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "Segoe UI, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Text size={700} weight="bold" style={{ color: "#242424", display: "block" }}>
            Quizzes
            <Badge appearance="filled" color="informative" style={{ marginLeft: "10px", borderRadius: "12px" }}>
              {quizzes.length}
            </Badge>
          </Text>
          <Text size={200} style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
            Create, edit, link to subtopics, and manage all quizzes independently.
          </Text>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface style={{ width: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <Text size={300} weight="semibold">Search & Filter</Text>
              <Field label="Search Title / Topic">
                <Input
                  placeholder="Type to filter…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </Field>
              <Field label="Difficulty">
                <Select value={difficultyFilter} onChange={e => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Difficulties</option>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </Select>
              </Field>
            </PopoverSurface>
          </Popover>

          <Button appearance="primary" size="small" icon={<Sparkle20Regular />} onClick={openGenerateDialog}>
            Generate Quiz
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Card style={{
            borderRadius: "16px", padding: "48px", textAlign: "center",
            border: "1px dashed #d1d5db", display: "flex", flexDirection: "column",
            alignItems: "center", gap: "16px", maxWidth: "520px", width: "100%"
          }}>
            <Warning48Regular style={{ color: "#0078d4" }} />
            <Text size={500} weight="bold" block style={{ color: "#374151" }}>No Quizzes Yet</Text>
            <Text size={300} style={{ color: "#6b7280" }}>
              Create standalone quizzes here, then link them to subtopics to make them discoverable in the public view.
            </Text>
            <Button appearance="primary" icon={<Sparkle20Regular />} onClick={openGenerateDialog}>
              Generate First Quiz
            </Button>
          </Card>
        </div>
      ) : (
        <Card style={{ borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <DataGrid items={paginated} columns={columns} style={{ minWidth: "820px" }}>
              <DataGridHeader style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #eaeaea" }}>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell style={{ padding: "12px 16px", fontWeight: "bold" }}>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<Quiz>>
                {({ item, rowId }) => (
                  <DataGridRow<Quiz> key={rowId} style={{ borderBottom: "1px solid #f5f5f5" }}>
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

      {/* ── Generate Quiz Dialog (AI-powered) ── */}
      <Dialog open={generateDialogOpen} onOpenChange={(_, d) => setGenerateDialogOpen(d.open)}>
        <DialogSurface style={{ borderRadius: "14px", padding: "28px", maxWidth: "640px", width: "100%" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkle20Regular style={{ color: "#0078d4" }} />
                Generate Quiz with AI
              </div>
            </DialogTitle>
            <DialogContent style={{ paddingTop: "16px" }}>
              <GenerateQuizForm onSuccess={async () => {
                await fetchQuizzes();
                setGenerateDialogOpen(false);
              }} />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Edit Quiz Dialog ── */}
      <Dialog open={quizDialogOpen} onOpenChange={(_, d) => setQuizDialogOpen(d.open)}>
        <DialogSurface style={{ borderRadius: "12px", padding: "24px" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              Edit Quiz
            </DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "16px" }}>
              <Field label="Quiz Title" required>
                <Input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} style={{ width: "100%" }} />
              </Field>
              <Field label="Difficulty" required>
                <Select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))} style={{ width: "100%" }}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Order / Position">
                <Input type="number" placeholder="Leave blank for auto" value={quizForm.quizOrder} onChange={e => setQuizForm(f => ({ ...f, quizOrder: e.target.value }))} style={{ width: "100%" }} />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "24px" }}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveQuiz} disabled={!quizForm.title || loading}>
                {loading ? <Spinner size="tiny" /> : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Link Topics Dialog ── */}
      <Dialog open={linkDialogOpen} onOpenChange={(_, d) => setLinkDialogOpen(d.open)}>
        <DialogSurface style={{ borderRadius: "12px", padding: "24px" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              Link / Unlink Topics
            </DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "16px" }}>
              <Text size={300} style={{ color: "#6b7280" }}>
                Select the subtopics this quiz should appear under. A quiz can be linked to multiple topics.
              </Text>
              <Field label="Subtopics">
                <Combobox
                  multiselect
                  selectedOptions={selectedTopicIds}
                  onOptionSelect={(_, d) => setSelectedTopicIds(d.selectedOptions)}
                  value={selectedTopicIds.map(id => topics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select subtopics…"
                  style={{ width: "100%" }}
                >
                  {availableSubtopics.map(t => (
                    <Option key={t.id} value={t.id} text={t.title}>{t.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "24px" }}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveLinks} disabled={loading}>
                {loading ? <Spinner size="tiny" /> : "Save Links"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Quiz Detail Drawer ── */}
      <OverlayDrawer
        position="end"
        open={!!selectedQuizId}
        onOpenChange={(_, d) => setSelectedQuizId(d.open ? selectedQuizId : null)}
        style={{ width: "500px", maxWidth: "100%", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #eaeaea", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={() => setSelectedQuizId(null)} aria-label="Close" />
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text size={500} weight="bold" style={{ color: "#242424" }}>{activeQuiz?.title}</Text>
                {activeQuiz && <Badge appearance="filled" color={difficultyColor(activeQuiz.difficulty)}>{activeQuiz.difficulty}</Badge>}
              </div>
              <Text size={200} style={{ color: "#6b7280" }}>
                Order #{activeQuiz?.quizOrder} · {activeQuiz?._count.questions} questions · {activeQuiz?._count.attempts} attempts
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button appearance="outline" icon={<Edit20Regular />} size="small" onClick={() => activeQuiz && openEditDialog(activeQuiz)}>
              Edit
            </Button>
            <Button appearance="outline" icon={<Link20Regular />} size="small" onClick={() => activeQuiz && openLinkDialog(activeQuiz)}>
              Link Topics
            </Button>
            <Button
              appearance="subtle" icon={<Delete20Regular />} size="small"
              style={{ color: "#d13438" }}
              onClick={() => activeQuiz && handleDelete(activeQuiz)}
            >
              Delete
            </Button>
          </div>

          {/* Linked topics in drawer */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <Text size={400} weight="semibold" style={{ color: "#242424" }}>
                Linked Topics ({activeQuiz?.topics.length || 0})
              </Text>
            </div>

            {activeQuiz?.topics && activeQuiz.topics.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeQuiz.topics.map(t => (
                  <Card key={t.id} style={{
                    display: "flex", flexDirection: "row", justifyContent: "space-between",
                    alignItems: "center", padding: "12px 16px", border: "1px solid #f0f0f0",
                    borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BookOpen20Regular style={{ color: "#0078d4" }} />
                      <Text weight="semibold" size={300}>{t.title}</Text>
                    </div>
                    <Tooltip content="Unlink from this topic" relationship="label">
                      <Button
                        size="small" appearance="subtle" icon={<LinkDismiss20Regular />}
                        style={{ color: "#d13438" }}
                        onClick={() => activeQuiz && handleUnlinkTopic(activeQuiz.id, activeQuiz.title, t.id, t.title)}
                      />
                    </Tooltip>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d9d9d9" }}>
                <Text style={{ color: "#9ca3af" }}>No topics linked. Click "Link Topics" to associate this quiz with subtopics.</Text>
              </div>
            )}
          </div>

          <hr style={{ border: "0", borderTop: "1px solid #eaeaea", margin: "12px 0" }} />

          {/* Quiz Questions management in drawer */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <Text size={400} weight="semibold" style={{ color: "#242424" }}>
                Questions ({activeQuizDetail?.questions?.length || 0})
              </Text>
              <Button size="small" icon={<Add20Regular />} onClick={handleOpenAddQuestion}>
                Add Question
              </Button>
            </div>

            {activeQuizLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                <Spinner size="medium" label="Loading questions..." />
              </div>
            ) : activeQuizDetail?.questions && activeQuizDetail.questions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeQuizDetail.questions.map((q: any, idx: number) => (
                  <Card key={q.id} style={{
                    display: "flex", flexDirection: "column", gap: "8px", padding: "16px",
                    border: "1px solid #f0f0f0", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <Text weight="semibold" size={300} style={{ color: "#1f2937", lineHeight: "1.4" }}>
                        {idx + 1}. {q.text}
                      </Text>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <Button 
                          size="small" appearance="subtle" icon={<Edit20Regular />} 
                          onClick={() => handleOpenEditQuestion(q)} 
                          aria-label="Edit question"
                        />
                        <Button 
                          size="small" appearance="subtle" icon={<Delete20Regular />} 
                          style={{ color: "#d13438" }}
                          onClick={() => handleDeleteQuestion(q.id, q.text)} 
                          aria-label="Delete question"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: "2px solid #e5e7eb" }}>
                      {q.options.map((opt: string, oIdx: number) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <Text 
                            key={oIdx} 
                            size={200} 
                            style={{ 
                              color: isCorrect ? "#16a34a" : "#4b5563", 
                              fontWeight: isCorrect ? "bold" : "normal" 
                            }}
                          >
                            {oIdx + 1}. {opt} {isCorrect && "✓"}
                          </Text>
                        );
                      })}
                    </div>

                    {q.hint && (
                      <Text size={100} style={{ color: "#6b7280", fontStyle: "italic" }}>
                        Hint: {q.hint}
                      </Text>
                    )}
                    {q.description && (
                      <Text size={100} style={{ color: "#6b7280" }}>
                        Explanation: {q.description}
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d9d9d9" }}>
                <Text style={{ color: "#9ca3af" }}>No questions linked. Click "Add Question" to build questions manually.</Text>
              </div>
            )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={(_, d) => setQuestionDialogOpen(d.open)}>
        <DialogSurface style={{ borderRadius: "14px", padding: "28px", maxWidth: "600px", width: "100%" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {questionForm.id ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
              <Field label="Question Text" required>
                <Textarea 
                  value={questionForm.text} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))} 
                  placeholder="Enter the question text..." 
                  style={{ width: "100%", minHeight: "80px" }}
                />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {questionForm.options.map((opt, idx) => (
                  <Field key={idx} label={`Option ${idx + 1}`} required>
                    <Input 
                      value={opt} 
                      onChange={e => handleOptionChange(idx, e.target.value)} 
                      placeholder={`Enter option ${idx + 1}`} 
                      style={{ width: "100%" }}
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required>
                <Select 
                  value={questionForm.correctAnswer} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="">Select correct option...</option>
                  {questionForm.options.map((opt, idx) => (
                    opt.trim() && <option key={idx} value={opt}>{opt}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Hint (Optional)">
                <Input 
                  value={questionForm.hint} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, hint: e.target.value }))} 
                  placeholder="Enter a brief hint..." 
                  style={{ width: "100%" }}
                />
              </Field>

              <Field label="Explanation / Description">
                <Textarea 
                  value={questionForm.description} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Explain why this answer is correct..." 
                  style={{ width: "100%", minHeight: "80px" }}
                />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "24px" }}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button 
                appearance="primary" 
                onClick={handleSaveQuestion} 
                disabled={!questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || loading}
              >
                {loading ? <Spinner size="tiny" /> : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Confirmation Dialog ── */}
      <Dialog open={confirmDialog.open} onOpenChange={(_, d) => setConfirmDialog(p => ({ ...p, open: d.open }))}>
        <DialogSurface style={{ borderRadius: "12px", padding: "24px", maxWidth: "420px" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {confirmDialog.title}
            </DialogTitle>
            <DialogContent style={{ paddingTop: "12px" }}>
              <Text style={{ color: "#616161", fontSize: "14px", lineHeight: "1.5" }}>
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
