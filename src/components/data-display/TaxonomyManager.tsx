"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Layers,
  ChevronRight,
  MoreHorizontal,
  X,
  Link as LinkIcon,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { Alert } from "@/components/ui/Alert";
import Link from "next/link";
import NoData from "@/components/feedback/NoData";
import { difficultyColor } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { ExamDrawerBody, TopicDrawerBody, QuizDrawerBody } from "@/components/data-display/TaxonomyDrawers";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { Spinner } from "@/components/ui/Spinner";

import type { Exam, Topic, QuizSummary, QuizDetail, QuizQuestionDetail, FlatTopic } from "./TaxonomyManager.types";

const difficultyBadgeVariant = (difficulty: string) => {
  const diff = difficulty.toLowerCase();
  if (diff === "easy") return "success";
  if (diff === "medium") return "warning";
  if (diff === "hard") return "danger";
  return "default";
};

interface ExamForm {
  id: string;
  title: string;
  description: string;
}

interface TopicForm {
  id: string;
  title: string;
  description: string;
  examId: string;
  parentId: string;
}

interface QuestionForm {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
}

interface ExamDialogBodyProps {
  initialForm: ExamForm;
  onSave: (form: ExamForm) => Promise<void>;
  loading: boolean;
}

function ExamDialogBody({ initialForm, onSave, loading }: ExamDialogBodyProps) {
  const [form, setForm] = useState<ExamForm>(initialForm);
  const dialog = useDialog();

  useEffect(() => { setForm(initialForm); }, [initialForm]);

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={async () => { await onSave(form); dialog.close(); }} disabled={!form.title || loading}>Save</Button>
      </div>
    </div>
  );
}

interface TopicDialogBodyProps {
  initialForm: TopicForm;
  onSave: (form: TopicForm) => Promise<void>;
  loading: boolean;
}

function TopicDialogBody({ initialForm, onSave, loading }: TopicDialogBodyProps) {
  const [form, setForm] = useState<TopicForm>(initialForm);
  const dialog = useDialog();

  useEffect(() => { setForm(initialForm); }, [initialForm]);

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Title <span className="text-danger">*</span></label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
      </div>
      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={async () => { await onSave(form); dialog.close(); }} disabled={!form.title || loading}>Save</Button>
      </div>
    </div>
  );
}

interface QuizDialogBodyProps {
  initialTopicId: string;
  onSuccess: (result: GenerateQuizResponse) => Promise<void>;
}

function QuizDialogBody({ initialTopicId, onSuccess }: QuizDialogBodyProps) {
  const dialog = useDialog();

  return (
    <GenerateQuizForm
      initialTopicId={initialTopicId}
      onSuccess={async (result) => {
        await onSuccess(result);
        dialog.close();
      }}
    />
  );
}

interface QuestionDialogBodyProps {
  initialForm: QuestionForm;
  onSave: (form: QuestionForm) => Promise<void>;
  loading: boolean;
}

function QuestionDialogBody({ initialForm, onSave, loading }: QuestionDialogBodyProps) {
  const [form, setForm] = useState<QuestionForm>(initialForm);
  const dialog = useDialog();

  useEffect(() => { setForm(initialForm); }, [initialForm]);

  const handleOptionChange = (idx: number, val: string) => {
    setForm(prev => {
      const newOpts = [...prev.options];
      newOpts[idx] = val;
      let newCorrect = prev.correctAnswer;
      if (prev.correctAnswer === prev.options[idx]) {
        newCorrect = val;
      }
      return { ...prev, options: newOpts, correctAnswer: newCorrect };
    });
  };

  const handleSave = async () => {
    await onSave(form);
    dialog.close();
  };

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
        <Textarea
          value={form.text}
          onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Enter the question text..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {form.options.map((opt, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {idx + 1} <span className="text-danger">*</span></label>
            <Input
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              required
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correct Answer <span className="text-danger">*</span></label>
        <Select
          value={form.correctAnswer}
          onChange={e => setForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
          required
        >
          <option value="">Select correct option...</option>
          {form.options.map((opt, idx) => (
            opt.trim() && <option key={idx} value={opt}>{opt}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hint (Optional)</label>
        <Input
          value={form.hint}
          onChange={e => setForm(prev => ({ ...prev, hint: e.target.value }))}
          placeholder="e.g. Think about..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Explanation / Description <span className="text-danger">*</span></label>
        <Textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Explain why this option is correct..."
          rows={3}
          required
        />
      </div>

      <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
        <Button variant="outline" onClick={() => dialog.close()}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!form.text || !form.correctAnswer || !form.description || loading}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function TaxonomyManager({ view }: { view: "exams" | "main-topics" | "subtopics" }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Creation/Edit Dialog Controls
  const [examForm, setExamForm] = useState({ id: '', title: '', description: '' });
  const [topicForm, setTopicForm] = useState({ id: '', title: '', description: '', examId: '', parentId: '' });
  const [quizForm, setQuizForm] = useState({ id: '', title: '', quizOrder: '', topicId: '', difficulty: 'Medium' });

  // Selection states for linking existing items
  const [linkExamId, setLinkExamId] = useState<string | null>(null);
  const [linkTopicId, setLinkTopicId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);

  // Detail Drawer States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [activeQuizDetail, setActiveQuizDetail] = useState<QuizDetail | null>(null);
  const [activeQuizLoading, setActiveQuizLoading] = useState(false);

  // Pagination & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    dialog.confirm({ title, description, onConfirm });

  const dialog = useDialog();
  const panel = usePanel();

  const openExamLinkDialog = () =>
    dialog.open({
      title: "Link Existing Main Topics",
      showClose: false,
      body: (
        <LinkPicker
          description="Select standalone main topics to associate with this exam category."
          label="Main Topics"
          placeholder="Search topics..."
          items={availableMainTopics}
          selectedIds={selectedTopicIds}
          onSelectionChange={setSelectedTopicIds}
          emptyHint="Try adjusting your search or add a new topic first."
        />
      ),
      okText: "Save Links",
      onOk: handleSaveExamLinks,
    });

  const openTopicLinkDialog = () =>
    dialog.open({
      title: "Link Existing Sub Topics",
      showClose: false,
      body: (
        <LinkPicker
          description="Select existing subtopics to nest under this main topic."
          label="Subtopics"
          placeholder="Search subtopics..."
          items={availableSubtopics}
          selectedIds={selectedSubtopicIds}
          onSelectionChange={setSelectedSubtopicIds}
          emptyHint="Try adjusting your search or add a new subtopic first."
        />
      ),
      okText: "Save Links",
      onOk: handleSaveTopicLinks,
    });

  const openQuizLinkDialog = () =>
    dialog.open({
      title: "Link Existing Quizzes",
      showClose: false,
      body: (
        <LinkPicker
          description="Select existing quizzes to pull into this subtopic."
          label="Quizzes"
          placeholder="Search quizzes..."
          items={availableQuizzes}
          selectedIds={selectedQuizIds}
          onSelectionChange={setSelectedQuizIds}
          emptyHint="Try adjusting your search or generate a new quiz first."
        />
      ),
      okText: "Save Links",
      onOk: handleSaveQuizLinks,
    });

  const fetchData = async () => {
    setLoading(true);
    try {
      const examsRes = await fetch("/api/admin/exams");
      const examsData = await examsRes.json();
      if (Array.isArray(examsData)) setExams(examsData);

      const topicsRes = await fetch("/api/admin/topics?all=true");
      const topicsData = await topicsRes.json();
      if (Array.isArray(topicsData)) {
        setTopics(topicsData);
        const flats: FlatTopic[] = topicsData.map((t: Topic) => ({
          ...t,
          displayType: (t.parentTopics && t.parentTopics.length > 0) ? "Sub Topic" : "Main Topic"
        }));
        setFlatTopics(flats);
      }

      const quizzesRes = await fetch("/api/admin/quizzes");
      const quizzesData = await quizzesRes.json();
      if (Array.isArray(quizzesData)) setAllQuizzes(quizzesData);
    } catch (err) {
      console.error(err);
      setError("Failed to load taxonomy metadata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshActiveQuizDetail = async (id: string) => {
    setActiveQuizLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`);
      const data = await res.json();
      if (!data.error) setActiveQuizDetail(data);
    } catch (e) {
      console.error("Failed to load quiz details inside drawer:", e);
    } finally {
      setActiveQuizLoading(false);
    }
  };

  useEffect(() => {
    if (selectedQuizId) {
      refreshActiveQuizDetail(selectedQuizId);
    } else {
      setActiveQuizDetail(null);
    }
  }, [selectedQuizId]);

  // Drawers rendered via the shared panel host
  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;
    panel.open({
      title: `Exam settings: ${exam.title}`,
      width: "max-w-2xl",
      onClose: () => setSelectedExamId(null),
      body: (
        <ExamDrawerBody
          exam={exam}
          onLinkTopics={(e) => {
            setLinkExamId(e.id);
            setSelectedTopicIds(e.topics.map(t => t.id));
            openExamLinkDialog();
          }}
          onUnlinkTopic={handleUnlinkTopicFromExam}
        />
      ),
    });
  }, [selectedExamId, exams]);

  useEffect(() => {
    if (!selectedTopicId) return;
    const topic = topics.find(t => t.id === selectedTopicId) || flatTopics.find(t => t.id === selectedTopicId);
    if (!topic) return;
    panel.open({
      title: `Topic settings: ${topic.title}`,
      width: "max-w-2xl",
      onClose: () => setSelectedTopicId(null),
      body: (
        <TopicDrawerBody
          topic={topic}
          onLinkSubtopics={(t) => {
            setLinkTopicId(t.id);
            setSelectedSubtopicIds(t.subtopics?.map(s => s.id) || []);
            openTopicLinkDialog();
          }}
          onLinkQuizzes={(t) => {
            setLinkTopicId(t.id);
            setSelectedQuizIds(t.quizzes?.map(q => q.id) || []);
            openQuizLinkDialog();
          }}
          onUnlinkSubtopic={handleUnlinkSubtopicFromParent}
          onUnlinkQuiz={handleUnlinkQuizFromSubtopic}
          onDeleteQuiz={handleDeleteQuiz}
          onCreateQuiz={openNewQuizDialog}
          difficultyBadgeVariant={difficultyBadgeVariant}
        />
      ),
    });
  }, [selectedTopicId, topics, flatTopics]);

  useEffect(() => {
    if (!selectedQuizId) return;
    panel.open({
      title: `Quiz details: ${activeQuizDetail?.title ?? ""}`,
      width: "max-w-2xl",
      onClose: () => setSelectedQuizId(null),
      body: (
        <QuizDrawerBody
          quiz={activeQuizDetail}
          loading={activeQuizLoading}
          onAddQuestion={handleOpenAddQuestion}
          onEditQuestion={handleOpenEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          difficultyBadgeVariant={difficultyBadgeVariant}
        />
      ),
    });
  }, [selectedQuizId, activeQuizDetail, activeQuizLoading]);

  // Save / Update Exam
  const handleSaveExam = async (form: ExamForm) => {
    setLoading(true);
    setError(null);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/exams/${form.id}` : "/api/admin/exams";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchData();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save exam settings.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = (examId: string, title: string) => {
    triggerConfirm(
      "Delete Exam",
      `Permanently delete exam "${title}"? This unlinks all associated topics, but does not delete them.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/exams/${examId}`, { method: "DELETE" });
        await fetchData();
      }
    );
  };

  // Save / Update Topic (or Subtopic)
  const handleSaveTopic = async () => {
    setLoading(true);
    setError(null);
    const isEdit = !!topicForm.id;
    const url = isEdit ? `/api/admin/topics/${topicForm.id}` : "/api/admin/topics";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topicForm.title,
          description: topicForm.description,
          examId: topicForm.examId || null,
          parentId: topicForm.parentId || null
        })
      });
      const data = await res.json();
      if (!data.error) {
        setTopicDialogOpen(false);
        await fetchData();
        if (selectedTopicId) {
          setSelectedTopicId(null);
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save topic settings.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Topic
  const handleDeleteTopic = (topicId: string, title: string) => {
    triggerConfirm(
      "Delete Topic",
      `Permanently delete topic "${title}"? This unlinks nested elements and attempts.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/topics/${topicId}`, { method: "DELETE" });
        await fetchData();
        if (selectedTopicId === topicId) setSelectedTopicId(null);
      }
    );
  };

  // Link Standalone Topics to Exam
  const handleSaveExamLinks = async () => {
    if (!linkExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${linkExamId}/link-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedTopicIds })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchData();
        if (selectedExamId === linkExamId) {
          // Refresh open drawer state
          const refreshed = exams.find(e => e.id === linkExamId);
          if (refreshed) {
            setSelectedExamId(null);
            setTimeout(() => setSelectedExamId(linkExamId), 50);
          }
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to associate topics.");
    } finally {
      setLoading(false);
    }
  };

  // Unlink Topic from Exam
  const handleUnlinkTopicFromExam = async (topicId: string, topicTitle: string, examTitle: string, examId?: string) => {
    triggerConfirm(
      "Unlink Topic",
      `Unlink topic "${topicTitle}" from exam "${examTitle}"?`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/topics/${topicId}/unlink-exam${examId ? `?examId=${examId}` : ""}`, { method: "POST" });
        await fetchData();
        // Refresh drawer
        if (selectedExamId) {
          const id = selectedExamId;
          setSelectedExamId(null);
          setTimeout(() => setSelectedExamId(id), 50);
        }
      }
    );
  };

  // Link Subtopics to Main Topic
  const handleSaveTopicLinks = async () => {
    if (!linkTopicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topics/${linkTopicId}/link-subtopics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicIds: selectedSubtopicIds })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchData();
        if (selectedTopicId === linkTopicId) {
          setSelectedTopicId(null);
          setTimeout(() => setSelectedTopicId(linkTopicId), 50);
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to link subtopics.");
    } finally {
      setLoading(false);
    }
  };

  // Unlink Subtopic from Parent Main Topic
  const handleUnlinkSubtopicFromParent = async (subtopicId: string, subtopicTitle: string, parentTitle: string, parentId?: string) => {
    triggerConfirm(
      "Unlink Subtopic",
      `Unlink subtopic "${subtopicTitle}" from parent topic "${parentTitle}"?`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/topics/${subtopicId}/unlink-parent${parentId ? `?parentId=${parentId}` : ""}`, { method: "POST" });
        await fetchData();
        if (selectedTopicId) {
          const id = selectedTopicId;
          setSelectedTopicId(null);
          setTimeout(() => setSelectedTopicId(id), 50);
        }
      }
    );
  };

  // Link Quizzes to Subtopic
  const handleSaveQuizLinks = async () => {
    if (!linkTopicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topics/${linkTopicId}/link-quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizIds: selectedQuizIds })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchData();
        if (selectedTopicId === linkTopicId) {
          setSelectedTopicId(null);
          setTimeout(() => setSelectedTopicId(linkTopicId), 50);
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to link quizzes.");
    } finally {
      setLoading(false);
    }
  };

  // Unlink Quiz from Subtopic
  const handleUnlinkQuizFromSubtopic = async (quizId: string, quizTitle: string, topicTitle: string) => {
    triggerConfirm(
      "Unlink Quiz",
      `Unlink quiz "${quizTitle}" from subtopic "${topicTitle}"?`,
      async () => {
        if (!selectedTopicId) return;
        setLoading(true);
        
        // Find existing linked quizzes in subtopic and unlink this one
        const currentQuizzes = flatTopics.find(t => t.id === selectedTopicId)?.quizzes?.map(q => q.id) || [];
        const nextQuizzes = currentQuizzes.filter(id => id !== quizId);

        await fetch(`/api/admin/topics/${selectedTopicId}/link-quizzes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizIds: nextQuizzes })
        });

        await fetchData();
        if (selectedTopicId) {
          const id = selectedTopicId;
          setSelectedTopicId(null);
          setTimeout(() => setSelectedTopicId(id), 50);
        }
      }
    );
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    triggerConfirm(
      "Delete Quiz Permanently",
      `Permanently delete quiz "${quizTitle}"? This will delete all of its questions and attempt history.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/quizzes/${quizId}`, { method: "DELETE" });
        await fetchData();
        if (selectedTopicId) {
          const id = selectedTopicId;
          setSelectedTopicId(null);
          setTimeout(() => setSelectedTopicId(id), 50);
        }
      }
    );
  };

  // Open add child topic dialog
  const openNewTopicDialog = (examId: string, parentId: string) => {
    setTopicForm({
      id: "",
      title: "",
      description: "",
      examId: examId,
      parentId: parentId
    });
    setError(null);
    setTopicDialogOpen(true);
  };

  // Open add quiz dialog (nested inside topic details)
  const openNewQuizDialog = (topicId: string) => {
    setQuizForm({
      id: "",
      title: "",
      quizOrder: "",
      topicId: topicId,
      difficulty: "Medium"
    });
    setError(null);
    setQuizDialogOpen(true);
  };

  // Add Question inside Quiz Detail Drawer
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

  // Edit Question inside Quiz Detail Drawer
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

  // Save question inside drawer
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
        await refreshActiveQuizDetail(selectedQuizId);
        await fetchData();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save question.");
    } finally {
      setLoading(false);
    }
  };

  // Delete question inside drawer
  const handleDeleteQuestion = (questionId: string, text: string) => {
    triggerConfirm(
      "Delete Question",
      `Permanently delete this question? "${text.slice(0, 60)}..."`,
      async () => {
        if (!selectedQuizId) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            await refreshActiveQuizDetail(selectedQuizId);
            await fetchData();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const availableMainTopics = useMemo(() => {
    return flatTopics.filter(t => 
      (!t.parentTopics || t.parentTopics.length === 0) && 
      (!linkExamId || !t.exams || !t.exams.some(e => e.id === linkExamId))
    );
  }, [flatTopics, linkExamId]);

  const availableSubtopics = useMemo(() => {
    return flatTopics.filter(t => 
      t.id !== linkTopicId && 
      (!linkTopicId || !t.parentTopics || !t.parentTopics.some(p => p.id === linkTopicId))
    );
  }, [flatTopics, linkTopicId]);

  const availableQuizzes = useMemo(() => {
    return allQuizzes.filter(q => 
      !linkTopicId || !q.topics?.some((t: { id: string }) => t.id === linkTopicId)
    );
  }, [allQuizzes, linkTopicId]);

  // Filters
  const filteredExams = exams.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayTopics = view === "main-topics" 
    ? flatTopics.filter(t => !t.parentTopics || t.parentTopics.length === 0) 
    : flatTopics.filter(t => t.parentTopics && t.parentTopics.length > 0);

  const filteredTopics = displayTopics.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalItems = view === "exams" ? filteredExams.length : filteredTopics.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading && exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground select-none">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Loading taxonomy registry…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

      {/* EXAMS VIEW */}
      {view === "exams" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Exams</span>
                <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
                  {filteredExams.length}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage the top-level exams representing major categories of your curriculum.
              </p>
            </div>

            <Button 
              variant="primary" 
              size="sm" 
              className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
              onClick={() => {
                setExamForm({ id: '', title: '', description: '' });
                setExamDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Exam</span>
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search exams..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10 w-full"
            />
          </div>

          {filteredExams.length === 0 ? (
            <NoData 
              title="No Exams Found" 
              description="Create an exam category to start structuring your topics and subtopics." 
              icon="warning"
              action={
                <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={() => {
                  setExamForm({ id: '', title: '', description: '' });
                  setExamDialogOpen(true);
                }}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Exam</span>
                </Button>
              }
            />
          ) : (
            <Card className="border-border/80 shadow-xs overflow-hidden p-0">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10">
                      <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Exam Title</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">Description</th>
                      <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Main Topics</th>
                      <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExams.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <button
                            onClick={() => setSelectedExamId(item.id)}
                            className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                          >
                            {item.title}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-xs">
                          {item.description || "No description provided."}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-foreground/90">{item.topics.length}</td>
                        <td className="py-3 px-4 text-center select-none">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setLinkExamId(item.id);
                                setSelectedTopicIds(item.topics.map(t => t.id));
                                openExamLinkDialog();
                              }}
                              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                            >
                              <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Dropdown>
                              <DropdownTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownContent align="right" className="w-44">
                                <DropdownItem onClick={() => setSelectedExamId(item.id)}>Manage Topics</DropdownItem>
                                <DropdownItem onClick={() => {
                                  setExamForm({ id: item.id, title: item.title, description: item.description || '' });
                                  setExamDialogOpen(true);
                                }}>Edit Settings</DropdownItem>
                                <DropdownItem onClick={() => handleDeleteExam(item.id, item.title)} className="text-danger">Delete Exam</DropdownItem>
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 gap-4 bg-secondary/5 text-xs select-none">
                <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                  <span>Show</span>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} 
                    className="h-8 w-16"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <span>entries</span>
                </div>

                <span className="text-muted-foreground/80 font-medium">
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </span>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 font-semibold text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 font-semibold text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* TOPICS / SUBTOPICS VIEW */}
      {(view === "main-topics" || view === "subtopics") && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{view === "main-topics" ? "Main Topics" : "Sub Topics"}</span>
                <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
                  {filteredTopics.length}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {view === "main-topics" 
                  ? "Manage top-level topic nodes under Exams or Standalone Topics." 
                  : "Manage fine-grained subtopics nested under Main Topics."}
              </p>
            </div>

            {view === "main-topics" ? (
              <Button 
                variant="primary" 
                size="sm" 
                className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
                onClick={() => openNewTopicDialog('', '')}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Standalone Topic</span>
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
                onClick={() => openNewTopicDialog('', '')}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Sub Topic</span>
              </Button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder={`Search ${view === "main-topics" ? "main topics" : "subtopics"}...`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10 w-full"
            />
          </div>

          {filteredTopics.length === 0 ? (
            <NoData 
              title={`No ${view === "main-topics" ? "Main Topics" : "Sub Topics"} Found`}
              description={view === "main-topics" 
                ? 'Create Standalone Topics here, or add main topics to specific Exams from the Exams tab.' 
                : 'Add subtopics directly here, or click the branch icon on any Main Topic in the Main Topics tab.'}
              icon="warning"
              action={
                <Button variant="primary" className="gap-1.5 font-semibold text-xs h-9 px-4" onClick={() => openNewTopicDialog('', '')}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First {view === "main-topics" ? "Topic" : "Subtopic"}</span>
                </Button>
              }
            />
          ) : (
            <Card className="border-border/80 shadow-xs overflow-hidden p-0">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10">
                      <th scope="col" className="py-3.5 px-4 font-bold max-w-sm">Topic Title</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">Hierarchy Level</th>
                      <th scope="col" className="py-3.5 px-4 font-bold text-center w-28">Stats</th>
                      <th scope="col" className="py-3.5 px-4 font-bold text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTopics.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <button
                            onClick={() => setSelectedTopicId(item.id)}
                            className="text-left font-semibold text-foreground hover:text-primary transition-colors cursor-pointer border-0 bg-transparent p-0"
                          >
                            {item.title}
                          </button>
                        </td>
                        <td className="py-3 px-4 select-none">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {item.parentTopics && item.parentTopics.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
                            <span className="font-medium text-xs">{item.displayType}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center select-none font-semibold text-foreground/80">
                          {view === "main-topics" ? (
                            <span>{item.subtopics?.length || 0} Subtopics</span>
                          ) : (
                            <span>{item.quizzes?.length || 0} Quizzes</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center select-none">
                          <div className="flex items-center justify-center gap-1.5">
                            {(!item.parentTopics || item.parentTopics.length === 0) ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLinkTopicId(item.id);
                                  setSelectedSubtopicIds(item.subtopics?.map(s => s.id) || []);
                                  openTopicLinkDialog();
                                }}
                                className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLinkTopicId(item.id);
                                  setSelectedQuizIds(item.quizzes?.map(q => q.id) || []);
                                  openQuizLinkDialog();
                                }}
                                className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg border border-border/50 bg-surface"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Dropdown>
                              <DropdownTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-surface-hover rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownContent align="right" className="w-44">
                                <DropdownItem onClick={() => setSelectedTopicId(item.id)}>Manage Associations</DropdownItem>
                                
                                {(!item.parentTopics || item.parentTopics.length === 0) && (
                                  <DropdownItem onClick={() => openNewTopicDialog('', item.id)}>Add Sub Topic</DropdownItem>
                                )}

                                <DropdownItem onClick={() => {
                                  setTopicForm({ id: item.id, title: item.title, description: item.description || '', examId: '', parentId: item.parentTopics?.[0]?.id || '' });
                                  setTopicDialogOpen(true);
                                }}>Edit Settings</DropdownItem>
                                <DropdownItem onClick={() => handleDeleteTopic(item.id, item.title)} className="text-danger">Delete Topic</DropdownItem>
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 gap-4 bg-secondary/5 text-xs select-none">
                <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                  <span>Show</span>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} 
                    className="h-8 w-16"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <span>entries</span>
                </div>

                <span className="text-muted-foreground/80 font-medium">
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </span>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 font-semibold text-xs"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 font-semibold text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Exam Settings Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogSurface className="max-w-[440px]">
          <DialogTitle>{examForm.id ? "Edit Exam" : "Add Exam"}</DialogTitle>
          <DialogContent className="flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Title <span className="text-danger">*</span></label>
              <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
              <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} rows={3} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveExam} disabled={!examForm.title || loading}>Save</Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Generate Quiz (AI-powered) Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogSurface className="max-w-[540px]">
          <DialogTitle>Generate Quiz with AI</DialogTitle>
          <DialogContent className="mt-3">
            <GenerateQuizForm 
              initialTopicId={quizForm.topicId}
              onSuccess={async () => {
                await fetchData();
                setQuizDialogOpen(false);
              }} 
            />
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* Topic / Subtopic Settings Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogSurface className="max-w-[440px]">
          <DialogTitle>
            {topicForm.id ? "Edit Topic Settings" : (topicForm.parentId ? "Add Sub Topic" : (topicForm.examId ? "Add Main Topic" : "Add Topic"))}
          </DialogTitle>
          <DialogContent className="flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Title <span className="text-danger">*</span></label>
              <Input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
              <Textarea value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} rows={3} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTopic} disabled={!topicForm.title || loading}>Save</Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Add / Edit Question Dialog (nested under drawer context) */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogSurface className="max-w-[600px]">
          <DialogTitle>{questionForm.id ? "Edit Question" : "Add Question"}</DialogTitle>
          <DialogContent className="max-h-[60vh] overflow-y-auto pr-1 flex flex-col gap-4 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Text <span className="text-danger">*</span></label>
              <Textarea 
                value={questionForm.text} 
                onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))} 
                placeholder="Enter the question text..." 
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option {idx + 1} <span className="text-danger">*</span></label>
                  <Input
                    value={opt}
                    onChange={e => setQuestionForm(prev => ({
                      ...prev,
                      options: prev.options.map((o, i) => (i === idx ? e.target.value : o)),
                    }))}
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correct Answer <span className="text-danger">*</span></label>
              <Select 
                value={questionForm.correctAnswer} 
                onChange={e => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                required
              >
                <option value="">Select correct option...</option>
                {questionForm.options.map((opt, idx) => (
                  opt.trim() && <option key={idx} value={opt}>{opt}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hint (Optional)</label>
              <Input 
                value={questionForm.hint} 
                onChange={e => setQuestionForm(prev => ({ ...prev, hint: e.target.value }))} 
                placeholder="e.g. Think about..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Explanation / Description <span className="text-danger">*</span></label>
              <Textarea 
                value={questionForm.description} 
                onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Explain why this option is correct..."
                rows={3}
                required
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveQuestion} disabled={!questionForm.text || !questionForm.correctAnswer || !questionForm.description || loading}>
              Save
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
export default TaxonomyManager;
