"use client";

import { useCallback } from "react";

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

interface TaxonomyActionsDeps {
  fetchData: () => Promise<void>;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  triggerConfirm: (title: string, desc: string, onConfirm: () => Promise<void>) => void;
  toast: { addToast: (t: { type: string; message: string }) => void };
  selectedQuizId: string | null;
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;
  refreshActiveQuizDetail?: (id: string) => Promise<void>;
}

export function useTaxonomyActions(deps: TaxonomyActionsDeps) {
  const { fetchData, setLoading, setError, triggerConfirm, toast, selectedQuizId, selectedTopicId, setSelectedTopicId, refreshActiveQuizDetail } = deps;

  const handleSaveExam = useCallback(async (form: ExamForm) => {
    setLoading(true);
    setError(null);
    const isEdit = !!form.id;
    const url = isEdit ? `/api/admin/exams/${form.id}` : "/api/admin/exams";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description }),
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
  }, [fetchData, setLoading, setError, toast]);

  const handleDeleteExam = useCallback((examId: string, title: string) => {
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
  }, [fetchData, setLoading, triggerConfirm, toast]);

  const handleSaveTopic = useCallback(async (form: TopicForm) => {
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
          parentId: form.parentId || null,
        }),
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
  }, [fetchData, setLoading, setError, toast, selectedTopicId, setSelectedTopicId]);

  const handleDeleteTopic = useCallback((topicId: string, title: string) => {
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
  }, [fetchData, setLoading, triggerConfirm, toast, selectedTopicId, setSelectedTopicId]);

  const handleSaveExamLinks = useCallback(async (linkExamId: string | null, selectedTopicIds: string[]) => {
    if (!linkExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${linkExamId}/link-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedTopicIds }),
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
  }, [fetchData, setLoading, setError, toast]);

  const handleUnlinkTopicFromExam = useCallback(async (topicId: string, topicTitle: string, examTitle: string, examId?: string) => {
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
  }, [fetchData, setLoading, triggerConfirm, toast]);

  const handleSaveTopicLinks = useCallback(async (linkTopicId: string | null, selectedSubtopicIds: string[]) => {
    if (!linkTopicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topics/${linkTopicId}/link-subtopics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopicIds: selectedSubtopicIds }),
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
  }, [fetchData, setLoading, setError, toast]);

  const handleUnlinkSubtopicFromParent = useCallback(async (subtopicId: string, subtopicTitle: string, parentTitle: string, parentId?: string) => {
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
  }, [fetchData, setLoading, triggerConfirm, toast]);

  const handleSaveQuizLinks = useCallback(async (linkTopicId: string | null, selectedQuizIds: string[]) => {
    if (!linkTopicId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topics/${linkTopicId}/link-quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizIds: selectedQuizIds }),
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
  }, [fetchData, setLoading, setError, toast]);

  const handleUnlinkQuizFromSubtopic = useCallback(async (quizId: string, quizTitle: string, topicTitle: string, flatTopics: { id: string; quizzes?: { id: string }[] }[]) => {
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
          body: JSON.stringify({ quizIds: nextQuizzes }),
        });
        await fetchData();
        toast.addToast({ type: "success", message: "Quiz unlinked" });
      }
    );
  }, [fetchData, setLoading, triggerConfirm, toast, selectedTopicId]);

  const handleDeleteQuiz = useCallback(async (quizId: string, quizTitle: string) => {
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
  }, [fetchData, setLoading, triggerConfirm, toast]);

  const handleSaveQuestion = useCallback(async (form: QuestionForm) => {
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
      description: form.description,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.error) {
        if (refreshActiveQuizDetail) await refreshActiveQuizDetail(selectedQuizId);
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
  }, [selectedQuizId, fetchData, setLoading, setError, toast, refreshActiveQuizDetail]);

  const handleDeleteQuestion = useCallback((questionId: string, text: string) => {
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
            if (refreshActiveQuizDetail) await refreshActiveQuizDetail(selectedQuizId);
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
  }, [selectedQuizId, fetchData, setLoading, triggerConfirm, toast, refreshActiveQuizDetail]);

  return {
    handleSaveExam,
    handleDeleteExam,
    handleSaveTopic,
    handleDeleteTopic,
    handleSaveExamLinks,
    handleUnlinkTopicFromExam,
    handleSaveTopicLinks,
    handleUnlinkSubtopicFromParent,
    handleSaveQuizLinks,
    handleUnlinkQuizFromSubtopic,
    handleDeleteQuiz,
    handleSaveQuestion,
    handleDeleteQuestion,
  };
}