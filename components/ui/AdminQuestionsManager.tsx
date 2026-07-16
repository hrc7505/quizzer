"use client";

import { useState } from "react";
import {
  Text, Button, Badge, Input, Card, Select, Spinner, Field, Textarea, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  Popover, PopoverTrigger, PopoverSurface,
  MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, Filter20Regular, Dismiss20Regular,
  BookOpen24Regular
} from "@fluentui/react-icons";
import { useAdminQuestionsManagerStyles } from "@/components/ui/styles/useAdminQuestionsManagerStyles";

interface QuizRef {
  id: string;
  title: string;
  topics: { id: string; title: string }[];
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
  quizId: string | null;
  quiz?: {
    id: string;
    title: string;
  } | null;
  topic?: {
    id: string;
    title: string;
  } | null;
}

interface AdminQuestionsManagerProps {
  /** List of all questions in DB. */
  questions: Question[];
  /** List of all quizzes (to assign questions to). */
  quizzes: QuizRef[];
}

/**
 * AdminQuestionsManager — administrative management panel for individual questions.
 * Supports manual create, edit, delete, searching, and filtering by quiz.
 */
export function AdminQuestionsManager({ questions: initial, quizzes }: AdminQuestionsManagerProps) {
  const styles = useAdminQuestionsManagerStyles();
  const [questions, setQuestions] = useState<Question[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog & confirm states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  // Form state
  const [questionForm, setQuestionForm] = useState({
    id: "",
    quizId: "",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  // Filter / pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // Refresh questions list
  const fetchQuestions = async () => {
    const res = await fetch("/api/admin/questions");
    const data = await res.json();
    if (Array.isArray(data)) setQuestions(data);
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filtered = questions.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.quiz && q.quiz.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchQuiz = !quizFilter || q.quizId === quizFilter;
    return matchSearch && matchQuiz;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setQuestionForm({
      id: "",
      quizId: quizzes[0]?.id || "",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      hint: "",
      description: ""
    });
    setError(null);
    setQuestionDialogOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setQuestionForm({
      id: q.id,
      quizId: q.quizId || "",
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
    setLoading(true);
    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: questionForm.quizId,
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
        await fetchQuestions();
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

  const handleDelete = (q: Question) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${q.text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" });
        setQuestions(prev => prev.filter(item => item.id !== q.id));
      }
    );
  };

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size={700} weight="bold" className={styles.headerTitle}>
            Questions Directory
            <Badge appearance="filled" color="informative" className={styles.headerBadge}>
              {questions.length}
            </Badge>
          </Text>
          <Text size={200} className={styles.headerSubtitle}>
            Inspect, search, edit, or manually compose questions for any quiz.
          </Text>
        </div>

        <div className={styles.headerActions}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface className={styles.filterSurface}>
              <Text size={300} weight="semibold">Search & Filter</Text>
              <Field label="Search text / quiz">
                <Input
                  placeholder="Type to search…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </Field>
              <Field label="Filter by Quiz">
                <Select value={quizFilter} onChange={e => { setQuizFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Quizzes</option>
                  {quizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                  ))}
                </Select>
              </Field>
            </PopoverSurface>
          </Popover>

          <Button appearance="primary" size="small" icon={<Add20Regular />} onClick={handleOpenAdd}>
            Add Question
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <Card className={styles.emptyCard}>
            <BookOpen24Regular className={styles.emptyIcon} />
            <Text size={500} weight="bold" block className={styles.emptyTitle}>No Questions Found</Text>
            <Text size={300} className={styles.emptyText}>
              There are no questions populated in the database. You can generate a quiz with AI or add individual questions manually.
            </Text>
            <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>
              Create First Question
            </Button>
          </Card>
        </div>
      ) : (
        <div className={styles.listWrapper}>
          {/* Card list of questions */}
          <div className={styles.cardList}>
            {paginated.map((q, idx) => (
              <Card key={q.id} className={styles.questionCard}>
                <div className={styles.questionCardTop}>
                  <div>
                    <div className={styles.badgeRow}>
                      <Badge appearance="tint" color="informative" className={styles.badgeRounded}>
                        Quiz: {q.quiz?.title || "Unassigned"}
                      </Badge>
                      {q.topic && (
                        <Badge appearance="tint" color="brand" className={styles.badgeRounded}>
                          Topic: {q.topic.title}
                        </Badge>
                      )}
                    </div>
                    <Text size={400} weight="semibold" className={styles.questionText}>
                      {(currentPage - 1) * pageSize + idx + 1}. {q.text}
                    </Text>
                  </div>

                  <div className={styles.cardActions}>
                    <Tooltip content="Edit Question" relationship="label">
                      <Button size="small" icon={<Edit20Regular />} onClick={() => handleOpenEdit(q)} />
                    </Tooltip>
                    <Tooltip content="Delete Question" relationship="label">
                      <Button size="small" icon={<Delete20Regular />} className={styles.deleteButton} onClick={() => handleDelete(q)} />
                    </Tooltip>
                  </div>
                </div>

                <div className={styles.optionsGrid}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <div key={oIdx} className={styles.optionItem}>
                        <span className={`${styles.optionBadge} ${isCorrect ? styles.optionBadgeCorrect : styles.optionBadgeDefault}`}>
                          {oIdx + 1}
                        </span>
                        <Text size={200} className={isCorrect ? styles.optionTextCorrect : styles.optionTextDefault}>
                          {opt} {isCorrect && "✓"}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                {(q.hint || q.description) && (
                  <div className={styles.metaBlock}>
                    {q.hint && (
                      <Text size={100} className={styles.hintText}>
                        Hint: {q.hint}
                      </Text>
                    )}
                    {q.description && (
                      <Text size={100} className={styles.descriptionText}>
                        Explanation: {q.description}
                      </Text>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination Footer */}
          <Card className={styles.paginationCard}>
            <div className={styles.paginationLeft}>
              <Text size={200} className={styles.mutedText}>Show</Text>
              <Select value={pageSize.toString()} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} size="small" className={styles.pageSizeSelect}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <Text size={200} className={styles.mutedText}>entries</Text>
            </div>
            <Text size={200} className={styles.mutedText}>
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </Text>
            <div className={styles.paginationButtons}>
              <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={(_, d) => setQuestionDialogOpen(d.open)}>
        <DialogSurface className={styles.questionDialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {questionForm.id ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Parent Quiz" required>
                  <Select value={questionForm.quizId} onChange={e => setQuestionForm(prev => ({ ...prev, quizId: e.target.value }))} className={styles.fullWidth}>
                  <option value="">Select quiz assignment...</option>
                  {quizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Question Text" required>
                <Textarea 
                  value={questionForm.text} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))} 
                  placeholder="Enter the question text..." 
                  className={styles.textarea}
                />
              </Field>

              <div className={styles.optionsFormGrid}>
                {questionForm.options.map((opt, idx) => (
                  <Field key={idx} label={`Option ${idx + 1}`} required>
                     <Input 
                       value={opt} 
                       onChange={e => handleOptionChange(idx, e.target.value)} 
                       placeholder={`Enter option ${idx + 1}`} 
                       className={styles.fullWidth}
                     />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required>
                 <Select 
                   value={questionForm.correctAnswer} 
                   onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                   className={styles.fullWidth}
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
                   className={styles.fullWidth}
                 />
              </Field>

              <Field label="Explanation / Description">
                 <Textarea 
                   value={questionForm.description} 
                   onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                   placeholder="Explain why this answer is correct..." 
                   className={styles.textarea}
                 />
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button 
                appearance="primary" 
                onClick={handleSaveQuestion} 
                disabled={!questionForm.quizId || !questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || loading}
              >
                {loading ? <Spinner size="tiny" /> : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Confirmation Dialog ── */}
      <Dialog open={confirmDialog.open} onOpenChange={(_, d) => setConfirmDialog(p => ({ ...p, open: d.open }))}>
        <DialogSurface className={styles.confirmDialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {confirmDialog.title}
            </DialogTitle>
            <DialogContent className={styles.confirmContent}>
              <Text className={styles.confirmText}>
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
