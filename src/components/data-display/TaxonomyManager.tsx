"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Layers,
  ChevronRight,
  MoreHorizontal,
  Search,
  Link as LinkIcon,
} from "lucide-react";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { Alert } from "@/components/ui/Alert";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { ExamDrawerBody, TopicDrawerBody, QuizDrawerBody } from "@/components/data-display/TaxonomyDrawers";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { PageHeader } from "@/components/data-display/PageHeader";
import { LoadingSpinner } from "@/components/data-display/LoadingSpinner";
import { Pagination } from "@/components/data-display/Pagination";
import { TaxonomyExamRow } from "@/components/data-display/TaxonomyExamRow";
import { TaxonomyTopicRow } from "@/components/data-display/TaxonomyTopicRow";
import { ExamDialogBody, TopicDialogBody, QuizDialogBody, QuestionDialogBody } from "@/components/data-display/TaxonomyDialogBodies";

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

export function TaxonomyManager({ view }: { view: "exams" | "main-topics" | "subtopics" }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
   // Creation/Edit Dialog Controls
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
  const toast = useToast();

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
    Promise.resolve().then(() => {
      fetchData();
    });
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
      Promise.resolve().then(() => {
        refreshActiveQuizDetail(selectedQuizId);
      });
    } else {
      Promise.resolve().then(() => {
        setActiveQuizDetail(null);
      });
    }
  }, [selectedQuizId]);



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
        toast.addToast({ type: "success", message: "Exam saved" });
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
        toast.addToast({ type: "success", message: "Exam deleted" });
      }
    );
  };

  // Save / Update Topic (or Subtopic)
  const handleSaveTopic = async (form: TopicForm) => {
    setLoading(true);
    setError(null);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/topics/${form.id}` : "/api/admin/topics";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          examId: form.examId || null,
          parentId: form.parentId || null
        })
      });
      const data = await res.json();
      if (!data.error) {
        await fetchData();
        toast.addToast({ type: "success", message: "Topic saved" });
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
        toast.addToast({ type: "success", message: "Topic deleted" });
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
        toast.addToast({ type: "success", message: "Topics linked to exam" });
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
        toast.addToast({ type: "success", message: "Topic unlinked from exam" });
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
        toast.addToast({ type: "success", message: "Subtopics linked" });
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
        toast.addToast({ type: "success", message: "Subtopic unlinked" });
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
        toast.addToast({ type: "success", message: "Quizzes linked to topic" });
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
        
        const currentQuizzes = flatTopics.find(t => t.id === selectedTopicId)?.quizzes?.map(q => q.id) || [];
        const nextQuizzes = currentQuizzes.filter(id => id !== quizId);

        await fetch(`/api/admin/topics/${selectedTopicId}/link-quizzes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizIds: nextQuizzes })
        });

        await fetchData();
        toast.addToast({ type: "success", message: "Quiz unlinked" });
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
        toast.addToast({ type: "success", message: "Quiz deleted" });
      }
    );
  };

  // Open add child topic dialog
  const openNewTopicDialog = (examId: string, parentId: string) => {
    setError(null);
    dialog.open({
      title: parentId ? "Add Sub Topic" : (examId ? "Add Main Topic" : "Add Topic"),
      body: (
        <TopicDialogBody
          initialForm={{ id: "", title: "", description: "", examId, parentId }}
          onSave={handleSaveTopic}
          loading={loading}
        />
      ),
    });
  };

  // Open add quiz dialog (nested inside topic details)
  const openNewQuizDialog = (topicId: string) => {
    setError(null);
    dialog.open({
      title: "Generate Quiz with AI",
      body: (
        <QuizDialogBody
          initialTopicId={topicId}
          onSuccess={async () => {
            await fetchData();
          }}
        />
      ),
    });
  };

  // Add Question inside Quiz Detail Drawer
  const handleOpenAddQuestion = () => {
    setError(null);
    dialog.open({
      title: "Add Question",
      body: (
        <QuestionDialogBody
          initialForm={{ id: "", text: "", options: ["", "", "", ""], correctAnswer: "", hint: "", description: "" }}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  // Edit Question inside Quiz Detail Drawer
  const handleOpenEditQuestion = (q: QuizQuestionDetail) => {
    setError(null);
    dialog.open({
      title: "Edit Question",
      body: (
        <QuestionDialogBody
          initialForm={{ id: q.id, text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, hint: q.hint || "", description: q.description || "" }}
          onSave={handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  };

  // Save question inside drawer
  const handleSaveQuestion = async (form: QuestionForm) => {
    if (!selectedQuizId) return;
    setLoading(true);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/questions/${form.id}` : "/api/admin/questions";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      quizId: selectedQuizId,
      text: form.text,
      options: form.options,
      correctAnswer: form.correctAnswer,
      hint: form.hint,
      description: form.description
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.error) {
        await refreshActiveQuizDetail(selectedQuizId);
        await fetchData();
        toast.addToast({ type: "success", message: "Question saved" });
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
            toast.addToast({ type: "success", message: "Question deleted" });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const availableMainTopics = flatTopics.filter(t => 
    (!t.parentTopics || t.parentTopics.length === 0) && 
    (!linkExamId || !t.exams || !t.exams.some(e => e.id === linkExamId))
  );

  const availableSubtopics = flatTopics.filter(t => 
    t.id !== linkTopicId && 
    (!linkTopicId || !t.parentTopics || !t.parentTopics.some(p => p.id === linkTopicId))
  );

  const availableQuizzes = allQuizzes.filter(q => 
    !linkTopicId || !q.topics?.some((t: { id: string }) => t.id === linkTopicId)
  );

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

  if (currentPage > totalPages) {
    setCurrentPage(1);
  }

  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  interface TaxonomyCallbacks {
    handleUnlinkTopicFromExam: (topicId: string, topicTitle: string, examTitle: string, examId?: string) => Promise<void>;
    openExamLinkDialog: () => void;
    openTopicLinkDialog: () => void;
    openQuizLinkDialog: () => void;
    handleUnlinkSubtopicFromParent: (subtopicId: string, subtopicTitle: string, parentTopicTitle: string, parentTopicId?: string) => Promise<void>;
    handleUnlinkQuizFromSubtopic: (quizId: string, quizTitle: string, subtopicTitle: string, subtopicId?: string) => Promise<void>;
    handleDeleteQuiz: (quizId: string, title: string) => Promise<void>;
    openNewQuizDialog: (topicId: string) => void;
    handleOpenAddQuestion: () => void;
    handleOpenEditQuestion: (q: QuizQuestionDetail) => void;
    handleDeleteQuestion: (questionId: string, text: string) => void;
  }

  // Callbacks ref to keep effect dependencies stable
  const callbacksRef = useRef<TaxonomyCallbacks | null>(null);
  useEffect(() => {
    callbacksRef.current = {
      handleUnlinkTopicFromExam,
      openExamLinkDialog,
      openTopicLinkDialog,
      openQuizLinkDialog,
      handleUnlinkSubtopicFromParent,
      handleUnlinkQuizFromSubtopic,
      handleDeleteQuiz,
      openNewQuizDialog,
      handleOpenAddQuestion,
      handleOpenEditQuestion,
      handleDeleteQuestion,
    };
  });

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
            callbacksRef.current?.openExamLinkDialog();
          }}
          onUnlinkTopic={(...args) => callbacksRef.current?.handleUnlinkTopicFromExam(...args)}
        />
      ),
    });
  }, [selectedExamId, exams, panel]);

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
            callbacksRef.current?.openTopicLinkDialog();
          }}
          onLinkQuizzes={(t) => {
            setLinkTopicId(t.id);
            setSelectedQuizIds(t.quizzes?.map(q => q.id) || []);
            callbacksRef.current?.openQuizLinkDialog();
          }}
          onUnlinkSubtopic={(...args) => callbacksRef.current?.handleUnlinkSubtopicFromParent(...args)}
          onUnlinkQuiz={(...args) => callbacksRef.current?.handleUnlinkQuizFromSubtopic(...args)}
          onDeleteQuiz={(...args) => callbacksRef.current?.handleDeleteQuiz(...args)}
          onCreateQuiz={(...args) => callbacksRef.current?.openNewQuizDialog(...args)}
          difficultyBadgeVariant={difficultyBadgeVariant}
        />
      ),
    });
  }, [selectedTopicId, topics, flatTopics, panel]);

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
          onAddQuestion={(...args) => callbacksRef.current?.handleOpenAddQuestion(...args)}
          onEditQuestion={(...args) => callbacksRef.current?.handleOpenEditQuestion(...args)}
          onDeleteQuestion={(...args) => callbacksRef.current?.handleDeleteQuestion(...args)}
          difficultyBadgeVariant={difficultyBadgeVariant}
        />
      ),
    });
  }, [selectedQuizId, activeQuizDetail, activeQuizLoading, panel]);

  if (loading && exams.length === 0) {
    return <LoadingSpinner text="Loading taxonomy registry..." className="py-20" />;
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
          <PageHeader
            title="Exams"
            badge={
              <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
                {filteredExams.length}
              </Badge>
            }
            description="Manage the top-level exams representing major categories of your curriculum."
            actions={
              <Button 
                variant="primary" 
                size="sm" 
                className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
                onClick={() => {
                  dialog.open({
                    title: "Add Exam",
                    body: (
                      <ExamDialogBody
                        initialForm={{ id: '', title: '', description: '' }}
                        onSave={handleSaveExam}
                        loading={loading}
                      />
                    ),
                  });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Exam</span>
              </Button>
            }
          />

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
                  dialog.open({
                    title: "Add Exam",
                    body: (
                      <ExamDialogBody
                        initialForm={{ id: '', title: '', description: '' }}
                        onSave={handleSaveExam}
                        loading={loading}
                      />
                    ),
                  });
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
                    <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
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
                                  dialog.open({
                                    title: "Edit Exam",
                                    body: (
                                      <ExamDialogBody
                                        initialForm={{ id: item.id, title: item.title, description: item.description || '' }}
                                        onSave={handleSaveExam}
                                        loading={loading}
                                      />
                                    ),
                                  });
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
              <Pagination
                totalItems={totalItems}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageSizeChange={v => { setPageSize(v); setCurrentPage(1); }}
                onPageChange={setCurrentPage}
              />
            </Card>
          )}
        </>
      )}

      {/* TOPICS / SUBTOPICS VIEW */}
      {(view === "main-topics" || view === "subtopics") && (
        <>
          <PageHeader
            title={view === "main-topics" ? "Main Topics" : "Sub Topics"}
            badge={
              <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px] animate-none">
                {filteredTopics.length}
              </Badge>
            }
            description={
              view === "main-topics"
                ? "Manage top-level topic nodes under Exams or Standalone Topics."
                : "Manage fine-grained subtopics nested under Main Topics."
            }
            actions={
              <Button 
                variant="primary" 
                size="sm" 
                className="gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs" 
                onClick={() => openNewTopicDialog('', '')}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{view === "main-topics" ? "Add Standalone Topic" : "Add Sub Topic"}</span>
              </Button>
            }
          />

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
                    <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10 sticky top-0 z-10">
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
                                  dialog.open({
                                    title: item.id ? "Edit Topic Settings" : (item.parentTopics?.[0]?.id ? "Add Sub Topic" : "Add Topic"),
                                    body: (
                                      <TopicDialogBody
                                        initialForm={{ id: item.id, title: item.title, description: item.description || '', examId: '', parentId: item.parentTopics?.[0]?.id || '' }}
                                        onSave={handleSaveTopic}
                                        loading={loading}
                                      />
                                    ),
                                  });
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
              <Pagination
                totalItems={totalItems}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageSizeChange={v => { setPageSize(v); setCurrentPage(1); }}
                onPageChange={setCurrentPage}
              />
            </Card>
          )}
        </>
      )}

    </div>
  );
}
export default TaxonomyManager;
