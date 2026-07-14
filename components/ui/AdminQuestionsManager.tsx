"use client";

import { useState } from "react";
import {
  Text, Button, Badge, Input, Card, Select, Spinner, Field, Textarea, Tooltip,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger,
  Popover, PopoverTrigger, PopoverSurface,
} from "@fluentui/react-components";
import {
  Add20Regular, Edit20Regular, Delete20Regular, Filter20Regular, Dismiss20Regular,
  BookOpen24Regular
} from "@fluentui/react-icons";

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
  const [questions, setQuestions] = useState<Question[]>(initial);
  const [loading, setLoading] = useState(false);

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
        alert(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving question");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Text size={700} weight="bold" style={{ color: "#242424", display: "block" }}>
            Questions Directory
            <Badge appearance="filled" color="informative" style={{ marginLeft: "10px", borderRadius: "12px" }}>
              {questions.length}
            </Badge>
          </Text>
          <Text size={200} style={{ color: "#6b7280", marginTop: "4px", display: "block" }}>
            Inspect, search, edit, or manually compose questions for any quiz.
          </Text>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Popover>
            <PopoverTrigger disableButtonEnhancement>
              <Button size="small" icon={<Filter20Regular />}>Filter</Button>
            </PopoverTrigger>
            <PopoverSurface style={{ width: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
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
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Card style={{
            borderRadius: "16px", padding: "48px", textAlign: "center",
            border: "1px dashed #d1d5db", display: "flex", flexDirection: "column",
            alignItems: "center", gap: "16px", maxWidth: "520px", width: "100%"
          }}>
            <BookOpen24Regular style={{ color: "#0078d4", fontSize: "48px" }} />
            <Text size={500} weight="bold" block style={{ color: "#374151" }}>No Questions Found</Text>
            <Text size={300} style={{ color: "#6b7280" }}>
              There are no questions populated in the database. You can generate a quiz with AI or add individual questions manually.
            </Text>
            <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAdd}>
              Create First Question
            </Button>
          </Card>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card list of questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {paginated.map((q, idx) => (
              <Card key={q.id} style={{
                borderRadius: "14px", border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)", padding: "24px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <Badge appearance="tint" color="informative" style={{ borderRadius: "6px" }}>
                        Quiz: {q.quiz?.title || "Unassigned"}
                      </Badge>
                      {q.topic && (
                        <Badge appearance="tint" color="brand" style={{ borderRadius: "6px" }}>
                          Topic: {q.topic.title}
                        </Badge>
                      )}
                    </div>
                    <Text size={400} weight="semibold" style={{ color: "#0f172a", lineHeight: "1.4", display: "block" }}>
                      {(currentPage - 1) * pageSize + idx + 1}. {q.text}
                    </Text>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <Tooltip content="Edit Question" relationship="label">
                      <Button size="small" icon={<Edit20Regular />} onClick={() => handleOpenEdit(q)} />
                    </Tooltip>
                    <Tooltip content="Delete Question" relationship="label">
                      <Button size="small" icon={<Delete20Regular />} style={{ color: "#d13438" }} onClick={() => handleDelete(q)} />
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

          {/* Pagination Footer */}
          <Card style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: "12px",
            backgroundColor: "white", flexWrap: "wrap", gap: "10px"
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
          </Card>
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
              <Field label="Parent Quiz" required>
                <Select
                  value={questionForm.quizId}
                  onChange={e => setQuestionForm(prev => ({ ...prev, quizId: e.target.value }))}
                  style={{ width: "100%" }}
                >
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
