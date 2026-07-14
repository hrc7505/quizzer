"use client";

import { useState } from "react";
import {
  Text, Button, Badge, Card, Spinner, Field, Input, Textarea, Select, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, ArrowLeft20Regular, Dismiss20Regular
} from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

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
  const [quiz, setQuiz] = useState<QuizDetail>(initialQuiz);
  const [loading, setLoading] = useState(false);

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
        alert(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving question");
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

  const difficultyColor = (d: string): "success" | "warning" | "danger" =>
    d === "Easy" ? "success" : d === "Hard" ? "danger" : "warning";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Back button & Breadcrumbs */}
      <div>
        <Button 
          appearance="subtle" 
          icon={<ArrowLeft20Regular />} 
          onClick={() => router.back()}
          style={{ marginBottom: "12px" }}
        >
          Back
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Text size={200} style={{ color: "#6b7280" }}>Manage Quizzes</Text>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <Text size={200} weight="semibold" style={{ color: "#0f172a" }}>{quiz.title}</Text>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <Text size={200} style={{ color: "#6b7280" }}>Questions</Text>
        </div>
      </div>

      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Text size={700} weight="bold" style={{ color: "#242424" }}>
              {quiz.title} Questions
            </Text>
            <Badge appearance="filled" color={difficultyColor(quiz.difficulty)}>
              {quiz.difficulty}
            </Badge>
          </div>
          <Text size={200} style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
            Compose, modify, or remove questions linked to this quiz.
          </Text>
        </div>

        <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>
          Add Question
        </Button>
      </div>

      {/* Questions list */}
      {quiz.questions.length === 0 ? (
        <Card style={{
          borderRadius: "16px", padding: "48px", textAlign: "center",
          border: "1px dashed #d1d5db", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "16px"
        }}>
          <Text size={500} weight="bold" style={{ color: "#374151" }}>No Questions Yet</Text>
          <Text size={300} style={{ color: "#6b7280", maxWidth: "460px" }}>
            This quiz has no questions. Click &quot;Add Question&quot; below to add a question manually.
          </Text>
          <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>
            Add First Question
          </Button>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} style={{
              borderRadius: "14px", border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)", padding: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <Text size={400} weight="semibold" style={{ color: "#0f172a", lineHeight: "1.4", display: "block" }}>
                  {idx + 1}. {q.text}
                </Text>
                
                <div style={{ display: "flex", gap: "6px" }}>
                  <Tooltip content="Edit Question" relationship="label">
                    <Button size="small" icon={<Edit20Regular />} onClick={() => handleOpenEdit(q)} />
                  </Tooltip>
                  <Tooltip content="Delete Question" relationship="label">
                    <Button size="small" icon={<Delete20Regular />} style={{ color: "#d13438" }} onClick={() => handleDelete(q.id, q.text)} />
                  </Tooltip>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "14px", paddingLeft: "12px", borderLeft: "3px solid #e2e8f0" }}>
                {q.options.map((opt, oIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        backgroundColor: isCorrect ? "#dcfce7" : "#f1f5f9",
                        color: isCorrect ? "#15803d" : "#64748b",
                        fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
                      }}>
                        {oIdx + 1}
                      </span>
                      <Text size={200} style={{
                        color: isCorrect ? "#15803d" : "#334155",
                        fontWeight: isCorrect ? "600" : "normal"
                      }}>
                        {opt} {isCorrect && "✓"}
                      </Text>
                    </div>
                  );
                })}
              </div>

              {(q.hint || q.description) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  {q.hint && (
                    <Text size={100} style={{ color: "#64748b", fontStyle: "italic" }}>
                      Hint: {q.hint}
                    </Text>
                  )}
                  {q.description && (
                    <Text size={100} style={{ color: "#64748b" }}>
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
                      placeholder={`Option ${idx + 1}`} 
                      style={{ width: "100%" }}
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required>
                <Select 
                  value={questionForm.correctAnswer} 
                  onChange={(e, data) => setQuestionForm(prev => ({ ...prev, correctAnswer: data.value }))}
                  style={{ width: "100%" }}
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
                  style={{ width: "100%" }}
                />
              </Field>

              <Field label="Explanation / Description" required>
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
