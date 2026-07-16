"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Text, Button, Badge, Input, Card, Select, Spinner, Field, Textarea, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  Popover, PopoverTrigger, PopoverSurface,
  Combobox, Option,
  DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridBody, DataGridCell,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, Link20Regular, LinkDismiss20Regular,
  Filter20Regular, Dismiss20Regular, MoreHorizontal20Regular,
  BookOpen20Regular,
  Sparkle20Regular
} from "@fluentui/react-icons";
import { createTableColumn, TableColumnDefinition } from "@fluentui/react-components";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { difficultyColor } from "@/lib/format";
import { useQuizManagerStyles } from "./styles/useQuizManagerStyles";
import NoData from "@/components/feedback/NoData";

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
  const styles = useQuizManagerStyles();
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  type QuizQuestionDetail = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    hint?: string | null;
    description?: string | null;
  };

  type QuizDetail = {
    id: string;
    title: string;
    difficulty: string;
    quizOrder: number;
    questions?: QuizQuestionDetail[];
  };

  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizDetail | null>(null);

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

  const triggerConfirm = useCallback((title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm }),
  []);

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
    if (!selectedQuizId) {
      return;
    }



    // Defer async state updates to the async function itself.
    void (async () => {
      await loadQuizDetails(selectedQuizId);
    })();
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
    setError(null);
    setQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (q: QuizQuestionDetail) => {
    setQuestionForm({
      id: q.id,
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      hint: q.hint || "",
      description: q.description || ""
    });
    setError(null);
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
        setError(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      setError("Error saving question");
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
        setLoading(true);
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
        setLoading(false);
      }
    );
  };

  const handleDelete = useCallback((quiz: Quiz) => {
    triggerConfirm(
      "Delete Quiz",
      `Permanently delete "${quiz.title}"? This will also delete all ${quiz._count.questions} questions and ${quiz._count.attempts} attempt records. This cannot be undone.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
        setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
        if (selectedQuizId === quiz.id) setSelectedQuizId(null);
        setLoading(false);
      }
    );
  }, [triggerConfirm, selectedQuizId]);

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

  const columns = useMemo<TableColumnDefinition<Quiz>[]>(() => [
    createTableColumn<Quiz>({
      columnId: "title",
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => "Quiz Title",
      renderCell: (item) => (
        <Tooltip content="Click to view questions" relationship="label">
          <LinkButton
            appearance="transparent"
            className={styles.linkButtonTitle}
            href={`/admin/manage/quizzes/${item.id}/questions`}
          >
            {item.title}
          </LinkButton>
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
        <div className={styles.topicsWrap}>
          {item.topics.length === 0
            ? <Text size={100} className={styles.topicsUnlinkedText}>Unlinked</Text>
            : item.topics.map(t => (
              <Badge key={t.id} appearance="tint" color="informative" className={styles.topicBadge}>{t.title}</Badge>
            ))
          }
        </div>
      )
    }),
    createTableColumn<Quiz>({
      columnId: "stats",
      renderHeaderCell: () => "Stats",
      renderCell: (item) => (
        <div className={styles.statsWrap}>
          <Text size={100} className={styles.statOrderText}>#{item.quizOrder}</Text>
          <Text size={100} className={styles.statCountsText}>{item._count.questions} Qs · {item._count.attempts} attempts</Text>
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
              <MenuItem icon={<Link20Regular />} onClick={() => {
                setLinkQuizId(item.id);
                setSelectedTopicIds([]);
                setLinkDialogOpen(true);
              }}>Link Topics</MenuItem>
              <MenuItem icon={<Delete20Regular />} onClick={() => handleDelete(item)}>Delete Quiz</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )
    }),
   ], [handleDelete, styles]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <Text size={700} weight="bold" className={styles.titleText}>
            Quizzes
            <Badge appearance="filled" color="informative" className={styles.titleBadge}>
              {quizzes.length}
            </Badge>
          </Text>
          <Text size={200} className={styles.subtitleText}>
            Create, edit, link to subtopics, and manage all quizzes independently.
          </Text>
        </div>

        <div className={styles.headerActions}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface className={styles.filterPopover}>
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
        <NoData 
          title="No Quizzes Yet" 
          description="Create standalone quizzes here, then link them to subtopics to make them discoverable in the public view." 
          icon="warning"
          action={<Button appearance="primary" icon={<Sparkle20Regular />} onClick={openGenerateDialog}>Generate First Quiz</Button>}
        />
      ) : (
        <Card className={styles.tableCard}>
          <div className={styles.tableScrollWrap}>
            <DataGrid items={paginated} columns={columns} className={styles.dataGrid}>
              <DataGridHeader className={styles.dataGridHeader}>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell className={styles.dataGridHeaderCell}>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<Quiz>>
                {({ item, rowId }) => (
                  <DataGridRow<Quiz> key={rowId} className={styles.dataGridRow}>
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
            <div className={styles.paginationShowWrap}>
              <Text size={200} className={styles.paginationLabel}>Show</Text>
              <Select value={pageSize.toString()} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} size="small" className={styles.paginationSelect}>
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

      {/* ── Generate Quiz Dialog (AI-powered) ── */}
      <Dialog open={generateDialogOpen} onOpenChange={(_, d) => setGenerateDialogOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceMd}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              <div className={styles.dialogTitleRow}>
                <Sparkle20Regular className={styles.iconColorPrimary} />
                Generate Quiz with AI
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContentSmGap}>
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
        <DialogSurface className={styles.dialogSurfaceSm}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              Edit Quiz
            </DialogTitle>
            <DialogContent className={styles.dialogContentGap}>
              <Field label="Quiz Title" required>
                <Input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} className={styles.fullWidthInput} />
              </Field>
              <Field label="Difficulty" required>
                <Select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))} className={styles.fullWidthInput}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Order / Position">
                <Input type="number" placeholder="Leave blank for auto" value={quizForm.quizOrder} onChange={e => setQuizForm(f => ({ ...f, quizOrder: e.target.value }))} className={styles.fullWidthInput} />
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
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
        <DialogSurface className={styles.linkDialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              Link / Unlink Topics
            </DialogTitle>
            <DialogContent className={styles.linkDialogContent}>
              <Text size={300} className={styles.linkHelperText}>
                Select the subtopics this quiz should appear under. A quiz can be linked to multiple topics.
              </Text>
              <Field label="Subtopics">
                <Combobox
                  multiselect
                  selectedOptions={selectedTopicIds}
                  onOptionSelect={(_, d) => setSelectedTopicIds(d.selectedOptions)}
                  value={selectedTopicIds.map(id => topics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select subtopics…"
                  className={styles.fullWidthInput}
                >
                  {availableSubtopics.map(t => (
                    <Option key={t.id} value={t.id} text={t.title}>{t.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
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
        className={styles.drawer}
      >
        <DrawerHeader className={styles.drawerHeader}>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={() => setSelectedQuizId(null)} aria-label="Close" />
            }
          >
            <div className={styles.drawerTitleColumn}>
              <div className={styles.drawerTitleRow}>
                <Text size={500} weight="bold" className={styles.drawerQuizTitle}>{activeQuiz?.title}</Text>
                {activeQuiz && <Badge appearance="filled" color={difficultyColor(activeQuiz.difficulty)}>{activeQuiz.difficulty}</Badge>}
              </div>
              <Text size={200} className={styles.drawerSubtitle}>
                Order #{activeQuiz?.quizOrder} · {activeQuiz?._count.questions} questions · {activeQuiz?._count.attempts} attempts
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.drawerBody}>
          <div className={styles.drawerButtonRow}>
            <Button appearance="outline" icon={<Edit20Regular />} size="small" onClick={() => activeQuiz && openEditDialog(activeQuiz)}>
              Edit
            </Button>
            <Button appearance="outline" icon={<Link20Regular />} size="small" onClick={() => activeQuiz && openLinkDialog(activeQuiz)}>
              Link Topics
            </Button>
            <Button
              appearance="subtle" icon={<Delete20Regular />} size="small"
              className={styles.drawerDeleteButton}
              onClick={() => activeQuiz && handleDelete(activeQuiz)}
            >
              Delete
            </Button>
          </div>

          {/* Linked topics in drawer */}
          <div>
            <div className={styles.sectionHeaderRow}>
              <Text size={400} weight="semibold" className={styles.sectionTitle}>
                Linked Topics ({activeQuiz?.topics.length || 0})
              </Text>
            </div>

            {activeQuiz?.topics && activeQuiz.topics.length > 0 ? (
              <div className={styles.topicCardList}>
                {activeQuiz.topics.map(t => (
                  <Card key={t.id} className={styles.topicCard}>
                    <div className={styles.topicCardRow}>
                      <BookOpen20Regular className={styles.iconColorPrimary} />
                      <Text weight="semibold" size={300}>{t.title}</Text>
                    </div>
                    <Tooltip content="Unlink from this topic" relationship="label">
                      <Button
                        size="small" appearance="subtle" icon={<LinkDismiss20Regular />}
                        className={styles.topicUnlinkButton}
                        onClick={() => activeQuiz && handleUnlinkTopic(activeQuiz.id, activeQuiz.title, t.id, t.title)}
                      />
                    </Tooltip>
                  </Card>
                ))}
              </div>
            ) : (
              <NoData
                title="No topics linked."
                description='Click "Link Topics" to associate this quiz with subtopics.'
                icon="book"
                compact={true}
              />
            )}
          </div>

          <hr className={styles.divider} />

          {/* Quiz Questions management in drawer */}
          <div>
            <div className={styles.sectionHeaderRow}>
              <Text size={400} weight="semibold" className={styles.sectionTitle}>
                Questions ({activeQuizDetail?.questions?.length || 0})
              </Text>
              <Button size="small" icon={<Add20Regular />} onClick={handleOpenAddQuestion}>
                Add Question
              </Button>
            </div>

            {activeQuizLoading ? (
              <div className={styles.loadingWrap}>
                <Spinner size="medium" label="Loading questions..." />
              </div>
            ) : activeQuizDetail?.questions && activeQuizDetail.questions.length > 0 ? (
              <div className={styles.questionsCardList}>
                {activeQuizDetail.questions.map((q, idx: number) => (
                  <Card key={q.id} className={styles.questionCard}>
                    <div className={styles.questionCardTopRow}>
                      <Text weight="semibold" size={300} className={styles.questionText}>
                        {idx + 1}. {q.text}
                      </Text>
                      <div className={styles.questionButtonRow}>
                        <Button 
                          size="small" appearance="subtle" icon={<Edit20Regular />} 
                          onClick={() => handleOpenEditQuestion(q)} 
                          aria-label="Edit question"
                        />
                        <Button 
                          size="small" appearance="subtle" icon={<Delete20Regular />} 
                          className={styles.questionDeleteButton}
                          onClick={() => handleDeleteQuestion(q.id, q.text)} 
                          aria-label="Delete question"
                        />
                      </div>
                    </div>

                    <div className={styles.optionsList}>
                      {q.options.map((opt: string, oIdx: number) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <Text 
                            key={oIdx} 
                            size={200} 
                            className={isCorrect ? styles.optionCorrect : styles.optionIncorrect}
                          >
                            {oIdx + 1}. {opt} {isCorrect && "✓"}
                          </Text>
                        );
                      })}
                    </div>

                    {q.hint && (
                      <Text size={100} className={styles.hintText}>
                        Hint: {q.hint}
                      </Text>
                    )}
                    {q.description && (
                      <Text size={100} className={styles.explanationText}>
                        Explanation: {q.description}
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <NoData
                title="No questions linked."
                description='Click "Add Question" to build questions manually.'
                icon="book"
                compact={true}
              />
            )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={(_, d) => setQuestionDialogOpen(d.open)}>
        <DialogSurface className={styles.questionDialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {questionForm.id ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogContent className={styles.questionDialogContent}>
              <Field label="Question Text" required>
                <Textarea 
                  value={questionForm.text} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))} 
                  placeholder="Enter the question text..." 
                  className={styles.fullWidthTextarea}
                />
              </Field>

              <div className={styles.optionsGrid2Col}>
                {questionForm.options.map((opt, idx) => (
                  <Field key={idx} label={`Option ${idx + 1}`} required>
                    <Input 
                      value={opt} 
                      onChange={e => handleOptionChange(idx, e.target.value)} 
                      placeholder={`Enter option ${idx + 1}`} 
                      className={styles.fullWidthInput}
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required>
                <Select 
                  value={questionForm.correctAnswer} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  className={styles.fullWidthInput}
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
                  className={styles.fullWidthInput}
                />
              </Field>

              <Field label="Explanation / Description">
                <Textarea 
                  value={questionForm.description} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Explain why this answer is correct..." 
                  className={styles.fullWidthTextarea}
                />
              </Field>
            </DialogContent>
            <DialogActions className={styles.questionDialogActions}>
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
        <DialogSurface className={styles.confirmSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {confirmDialog.title}
            </DialogTitle>
            <DialogContent className={styles.confirmContent}>
              <Text className={styles.confirmBodyText}>
                {confirmDialog.description}
              </Text>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                className={styles.confirmButton}
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
