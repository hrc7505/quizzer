"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/data-display/LoadingSpinner";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { useToast, type ToastType } from "@/components/providers/ToastProvider";
import { LinkPicker } from "@/components/data-display/LinkPicker";
import { ExamDrawerBody, TopicDrawerBody, QuizDrawerBody } from "@/components/data-display/TaxonomyDrawers";
import {
  ExamDialogBody,
  TopicDialogBody,
  QuizDialogBody,
  QuestionDialogBody,
} from "@/components/data-display/TaxonomyDialogBodies";
import { TaxonomyExamsView } from "@/components/data-display/TaxonomyExamsView";
import { TaxonomyTopicsView } from "@/components/data-display/TaxonomyTopicsView";
import { useTaxonomyData } from "@/hooks/useTaxonomyData";
import { useTaxonomyActions } from "@/hooks/useTaxonomyActions";
import { QuizDetail, QuizQuestionDetail } from "@/components/data-display/TaxonomyManager.types";

const difficultyBadgeVariant = (difficulty: string) => {
  const diff = difficulty.toLowerCase();
  if (diff === "easy") return "success";
  if (diff === "medium") return "warning";
  if (diff === "hard") return "danger";
  return "default";
};

export function TaxonomyManager({ view }: { view: "exams" | "main-topics" | "subtopics" }) {
  const [{ exams, topics, flatTopics, allQuizzes, loading, error }, { fetchData, setLoading, setError }] =
    useTaxonomyData();

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

  const dialog = useDialog();
  const panel = usePanel();
  const toast = useToast();

  const addToast = useCallback(
    (t: { type: string; message: string }) => toast.addToast({ type: t.type as ToastType, message: t.message }),
    [toast]
  );

  const triggerConfirm = useCallback(
    (title: string, description: string, onConfirm: () => Promise<void>) =>
      dialog.confirm({ title, description, onConfirm }),
    [dialog]
  );

  const actions = useTaxonomyActions({
    fetchData,
    setLoading,
    setError,
    triggerConfirm,
    toast: { addToast },
    selectedQuizId,
    selectedTopicId,
    setSelectedTopicId,
    refreshActiveQuizDetail: async (id: string) => {
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
    },
  });

  // Computed values - must be declared before use in callbacks
  const availableMainTopics = useMemo(
    () =>
      flatTopics.filter(
        (t) =>
          (!t.parentTopics || t.parentTopics.length === 0) &&
          (!linkExamId || !t.exams || !t.exams.some((e) => e.id === linkExamId))
      ),
    [flatTopics, linkExamId]
  );

  const availableSubtopics = useMemo(
    () =>
      flatTopics.filter(
        (t) =>
          t.id !== linkTopicId &&
          (!linkTopicId || !t.parentTopics || !t.parentTopics.some((p) => p.id === linkTopicId))
      ),
    [flatTopics, linkTopicId]
  );

  const availableQuizzes = useMemo(
    () =>
      allQuizzes.filter(
        (q) => !linkTopicId || !q.topics?.some((t: { id: string }) => t.id === linkTopicId)
      ),
    [allQuizzes, linkTopicId]
  );

  // Open dialogs
  const openExamLinkDialog = useCallback(() => {
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
      onOk: () => actions.handleSaveExamLinks(linkExamId, selectedTopicIds),
    });
  }, [dialog, availableMainTopics, selectedTopicIds, linkExamId, actions]);

  const openTopicLinkDialog = useCallback(() => {
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
      onOk: () => actions.handleSaveTopicLinks(linkTopicId, selectedSubtopicIds),
    });
  }, [dialog, availableSubtopics, selectedSubtopicIds, linkTopicId, actions]);

  const openQuizLinkDialog = useCallback(() => {
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
      onOk: () => actions.handleSaveQuizLinks(linkTopicId, selectedQuizIds),
    });
  }, [dialog, availableQuizzes, selectedQuizIds, linkTopicId, actions]);

  const openNewTopicDialog = useCallback(
    (examId: string, parentId: string) => {
      setError(null);
      dialog.open({
        title: parentId ? "Add Sub Topic" : examId ? "Add Main Topic" : "Add Topic",
        body: (
          <TopicDialogBody
            initialForm={{ id: "", title: "", description: "", examId, parentId }}
            onSave={actions.handleSaveTopic}
            loading={loading}
          />
        ),
      });
    },
    [dialog, setError, actions, loading]
  );

  const openNewQuizDialog = useCallback(
    (topicId: string) => {
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
    },
    [dialog, setError, fetchData]
  );

  const handleOpenAddQuestion = useCallback(() => {
    setError(null);
    dialog.open({
      title: "Add Question",
      body: (
        <QuestionDialogBody
          initialForm={{
            id: "",
            text: "",
            options: ["", "", "", ""],
            correctAnswer: "",
            hint: "",
            description: "",
          }}
          onSave={actions.handleSaveQuestion}
          loading={loading}
        />
      ),
    });
  }, [dialog, setError, actions, loading]);

  const handleOpenEditQuestion = useCallback(
    (q: QuizQuestionDetail) => {
      setError(null);
      dialog.open({
        title: "Edit Question",
        body: (
          <QuestionDialogBody
            initialForm={{
              id: q.id,
              text: q.text,
              options: [...q.options],
              correctAnswer: q.correctAnswer,
              hint: q.hint || "",
              description: q.description || "",
            }}
            onSave={actions.handleSaveQuestion}
            loading={loading}
          />
        ),
      });
    },
    [dialog, setError, actions, loading]
  );

  // Filters
  const filteredExams = useMemo(
    () =>
      exams.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [exams, searchQuery]
  );

  const displayTopics = useMemo(
    () =>
      view === "main-topics"
        ? flatTopics.filter((t) => !t.parentTopics || t.parentTopics.length === 0)
        : flatTopics.filter((t) => t.parentTopics && t.parentTopics.length > 0),
    [view, flatTopics]
  );

  const filteredTopics = useMemo(
    () =>
      displayTopics.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [displayTopics, searchQuery]
  );

  const totalExams = filteredExams.length;
  const totalTopics = filteredTopics.length;
  const totalPagesExams = Math.ceil(totalExams / pageSize) || 1;
  const totalPagesTopics = Math.ceil(totalTopics / pageSize) || 1;

  if (currentPage > (view === "exams" ? totalPagesExams : totalPagesTopics)) {
    setCurrentPage(1);
  }

  const paginatedExams = useMemo(
    () => filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredExams, currentPage, pageSize]
  );

  const paginatedTopics = useMemo(
    () => filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredTopics, currentPage, pageSize]
  );

  // Callbacks ref for drawer effects - use proper types
  interface TaxonomyCallbacks {
    handleUnlinkTopicFromExam: (topicId: string, topicTitle: string, examTitle: string, examId?: string) => Promise<void>;
    openExamLinkDialog: () => void;
    openTopicLinkDialog: () => void;
    openQuizLinkDialog: () => void;
    handleUnlinkSubtopicFromParent: (subtopicId: string, subtopicTitle: string, parentTitle: string, parentId?: string) => Promise<void>;
    handleUnlinkQuizFromSubtopic: (quizId: string, quizTitle: string, topicTitle: string) => Promise<void>;
    handleDeleteQuiz: (quizId: string, quizTitle: string) => Promise<void>;
    openNewQuizDialog: (topicId: string) => void;
    handleOpenAddQuestion: () => void;
    handleOpenEditQuestion: (q: QuizQuestionDetail) => void;
    handleDeleteQuestion: (questionId: string, text: string) => void;
  }

  const callbacksRef = useRef<TaxonomyCallbacks | null>(null);
  useEffect(() => {
    callbacksRef.current = {
      handleUnlinkTopicFromExam: actions.handleUnlinkTopicFromExam,
      openExamLinkDialog,
      openTopicLinkDialog,
      openQuizLinkDialog,
      handleUnlinkSubtopicFromParent: actions.handleUnlinkSubtopicFromParent,
      handleUnlinkQuizFromSubtopic: (quizId: string, quizTitle: string, topicTitle: string) =>
        actions.handleUnlinkQuizFromSubtopic(quizId, quizTitle, topicTitle, flatTopics),
      handleDeleteQuiz: actions.handleDeleteQuiz,
      openNewQuizDialog,
      handleOpenAddQuestion,
      handleOpenEditQuestion,
      handleDeleteQuestion: actions.handleDeleteQuestion,
    };
  });

  // Drawers
  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find((e) => e.id === selectedExamId);
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
            setSelectedTopicIds(e.topics.map((t) => t.id));
            callbacksRef.current?.openExamLinkDialog();
          }}
          onUnlinkTopic={(...args) =>
            callbacksRef.current?.handleUnlinkTopicFromExam(...args)
          }
        />
      ),
    });
  }, [selectedExamId, exams, panel]);

  useEffect(() => {
    if (!selectedTopicId) return;
    const topic =
      topics.find((t) => t.id === selectedTopicId) ||
      flatTopics.find((t) => t.id === selectedTopicId);
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
            setSelectedSubtopicIds(t.subtopics?.map((s) => s.id) || []);
            callbacksRef.current?.openTopicLinkDialog();
          }}
          onLinkQuizzes={(t) => {
            setLinkTopicId(t.id);
            setSelectedQuizIds(t.quizzes?.map((q) => q.id) || []);
            callbacksRef.current?.openQuizLinkDialog();
          }}
          onUnlinkSubtopic={(...args) =>
            callbacksRef.current?.handleUnlinkSubtopicFromParent(...args)
          }
          onUnlinkQuiz={(...args) =>
            callbacksRef.current?.handleUnlinkQuizFromSubtopic(...args)
          }
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
        <TaxonomyExamsView
          exams={paginatedExams}
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalExams}
          onPageChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setCurrentPage(1);
          }}
          onAddExam={() => {
            dialog.open({
              title: "Add Exam",
              body: (
                <ExamDialogBody
                  initialForm={{ id: "", title: "", description: "" }}
                  onSave={actions.handleSaveExam}
                  loading={loading}
                />
              ),
            });
          }}
          onSelectExam={setSelectedExamId}
          onOpenLinkDialog={(exam) => {
            setLinkExamId(exam.id);
            setSelectedTopicIds(exam.topics.map((t) => t.id));
            openExamLinkDialog();
          }}
          onOpenEditDialog={(exam) => {
            dialog.open({
              title: "Edit Exam",
              body: (
                <ExamDialogBody
                  initialForm={{
                    id: exam.id,
                    title: exam.title,
                    description: exam.description || "",
                  }}
                  onSave={actions.handleSaveExam}
                  loading={loading}
                />
              ),
            });
          }}
          onDeleteExam={actions.handleDeleteExam}
        />
      )}

      {/* TOPICS / SUBTOPICS VIEW */}
      {(view === "main-topics" || view === "subtopics") && (
        <TaxonomyTopicsView
          view={view}
          topics={paginatedTopics}
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalTopics}
          onPageChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setCurrentPage(1);
          }}
          onAddTopic={() => openNewTopicDialog("", "")}
          onSelectTopic={setSelectedTopicId}
          onLinkSubtopics={(topic) => {
            setLinkTopicId(topic.id);
            setSelectedSubtopicIds(topic.subtopics?.map((s) => s.id) || []);
            openTopicLinkDialog();
          }}
          onLinkQuizzes={(topic) => {
            setLinkTopicId(topic.id);
            setSelectedQuizIds(topic.quizzes?.map((q) => q.id) || []);
            openQuizLinkDialog();
          }}
          onEditTopic={(topic) => {
            dialog.open({
              title: topic.id ? "Edit Topic Settings" : "Add Topic",
              body: (
                <TopicDialogBody
                  initialForm={{
                    id: topic.id,
                    title: topic.title,
                    description: topic.description || "",
                    examId: "",
                    parentId: topic.parentTopics?.[0]?.id || "",
                  }}
                  onSave={actions.handleSaveTopic}
                  loading={loading}
                />
              ),
            });
          }}
          onDeleteTopic={actions.handleDeleteTopic}
          onAddSubtopic={(topic) => openNewTopicDialog("", topic.id)}
        />
      )}
    </div>
  );
}

export default TaxonomyManager;