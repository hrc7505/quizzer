"use client";

import { useState } from "react";
import {
  Text, Button, Badge, Card, Spinner, Field, Input, Textarea, Select, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, ArrowLeft20Regular, Dismiss20Regular
} from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { difficultyColor } from "@/lib/format";
import NoData from "@/components/feedback/NoData";
import { useAdminQuizQuestionsManagerStyles } from "./styles/useAdminQuizQuestionsManagerStyles";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

interface QuizDetail {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  questions: Question[];
  topics: { id: string; title: string }[];
}

interface AdminQuizQuestionsManagerProps {
  /** The parent quiz detail pre-fetched server side. */
  quiz: QuizDetail;
}

/**
 * AdminQuizQuestionsManager — dedicated page component to manage questions for a single quiz.
 * Displays questions in cards with inline option lists and edit/delete controls.
 */
export function AdminQuizQuestionsManager({ quiz: initialQuiz }: AdminQuizQuestionsManagerProps) {
  const router = useRouter();
  const styles = useAdminQuizQuestionsManagerStyles();
  const [quiz, setQuiz] = useState<QuizDetail>(initialQuiz);
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
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    hint: "",
    description: ""
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    setConfirmDialog({ open: true, title, description, onConfirm });

  // Re-fetch quiz data
  const refreshQuiz = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`);
      const data = await res.json();
      if (!data.error) {
        setQuiz(data);
      }
    } catch (e) {
      console.error("Failed to refresh quiz questions:", e);
    }
  };

  const handleOpenAdd = () => {
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

  const handleOpenEdit = (q: Question) => {
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
    setLoading(true);
    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: quiz.id,
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
        await refreshQuiz();
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

  const handleDelete = (questionId: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${text.slice(0, 60)}..." This cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            await refreshQuiz();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
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
      {/* Back button & Breadcrumbs */}
      <div>
        <Button
          appearance="subtle"
          icon={<ArrowLeft20Regular />}
          onClick={() => router.back()}
          className={styles.backButton}
        >
          Back
        </Button>
        <div className={styles.breadcrumbsRow}>
          <Text size={200} className={styles.breadcrumbMuted}>Manage Quizzes</Text>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Text size={200} weight="semibold" className={styles.breadcrumbActive}>{quiz.title}</Text>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Text size={200} className={styles.breadcrumbMuted}>Questions</Text>
        </div>
      </div>

      {/* Header section */}
      <div className={styles.headerRow}>
        <div>
          <div className={styles.titleRow}>
            <Text size={700} weight="bold" className={styles.titlePrimary}>
              {quiz.title} Questions
            </Text>
            <Badge appearance="filled" color={difficultyColor(quiz.difficulty)}>
              {quiz.difficulty}
            </Badge>
          </div>
          <Text size={200} className={styles.subtitle}>
            Compose, modify, or remove questions linked to this quiz.
          </Text>
        </div>

        <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>
          Add Question
        </Button>
      </div>

      {/* Questions list */}
      {quiz.questions.length === 0 ? (
        <NoData 
          title="No Questions Yet" 
          description="This quiz has no questions. Click Add Question below to add a question manually." 
          icon="book"
          action={<Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>Add First Question</Button>}
        />
      ) : (
        <div className={styles.questionsList}>
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} className={styles.questionCard}>
              <div className={styles.questionHeaderRow}>
                <Text size={400} weight="semibold" className={styles.questionText}>
                  {idx + 1}. {q.text}
                </Text>

                <div className={styles.actionsRow}>
                  <Tooltip content="Edit Question" relationship="label">
                    <Button size="small" icon={<Edit20Regular />} onClick={() => handleOpenEdit(q)} />
                  </Tooltip>
                  <Tooltip content="Delete Question" relationship="label">
                    <Button size="small" icon={<Delete20Regular />} className={styles.deleteButton} onClick={() => handleDelete(q.id, q.text)} />
                  </Tooltip>
                </div>
              </div>

              <div className={styles.optionsGrid}>
                {q.options.map((opt, oIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div key={oIdx} className={styles.optionItem}>
                      <span className={`${styles.optionCircle} ${isCorrect ? styles.optionCircleCorrect : styles.optionCircleDefault}`}>
                        {oIdx + 1}
                      </span>
                      <Text size={200} className={isCorrect ? styles.optionLabelCorrect : styles.optionLabel}>
                        {opt} {isCorrect && "✓"}
                      </Text>
                    </div>
                  );
                })}
              </div>

              {(q.hint || q.description) && (
                <div className={styles.extrasBox}>
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
      )}

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={(_, d) => setQuestionDialogOpen(d.open)}>
        <DialogSurface className={styles.addEditDialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {questionForm.id ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogContent className={styles.addEditDialogContent}>
              <Field label="Question Text" required>
                <Textarea
                  value={questionForm.text}
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter the question text..."
                  className={styles.textareaFull}
                />
              </Field>

              <div className={styles.optionsFormGrid}>
                {questionForm.options.map((opt, idx) => (
                  <Field key={idx} label={`Option ${idx + 1}`} required>
                    <Input
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className={styles.inputFull}
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required>
                <Select
                  value={questionForm.correctAnswer}
                  onChange={(e, data) => setQuestionForm(prev => ({ ...prev, correctAnswer: data.value }))}
                  className={styles.inputFull}
                >
                  <option value="">Select correct option...</option>
                  {questionForm.options.filter(Boolean).map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Hint (Optional)">
                <Input
                  value={questionForm.hint}
                  onChange={e => setQuestionForm(prev => ({ ...prev, hint: e.target.value }))}
                  placeholder="Enter a brief hint..."
                  className={styles.inputFull}
                />
              </Field>

              <Field label="Explanation / Description" required>
                <Textarea
                  value={questionForm.description}
                  onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explain why this answer is correct..."
                  className={styles.textareaFull}
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
                disabled={!questionForm.text || questionForm.options.some(o => !o.trim()) || !questionForm.correctAnswer || !questionForm.description || loading}
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
            <DialogContent className={styles.confirmDialogContent}>
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
                className={styles.confirmButtonDanger}
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
