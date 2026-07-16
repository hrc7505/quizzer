"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Button, Card, Text, Input, Field, Dialog, DialogTrigger, 
  DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, 
  Spinner, Select, Textarea, Badge, Tooltip, MessageBar, MessageBarBody,
  Combobox, Option,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  Popover, PopoverTrigger, PopoverSurface
} from "@fluentui/react-components";
import { 
  Edit20Regular, Delete20Regular, Add20Regular, 
  BookOpen24Regular, DocumentDatabase24Regular, 
  ChevronRight20Regular, Branch20Regular,
  MoreHorizontal20Regular, Dismiss20Regular, LinkDismiss20Regular, Link20Regular,
  Filter20Regular, Sparkle20Regular
} from "@fluentui/react-icons";
import { TableColumnDefinition, createTableColumn, DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridBody, DataGridCell } from "@fluentui/react-components";
import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { LinkButton } from "@/components/ui/LinkButton";
import NoData from "@/components/feedback/NoData";
import { difficultyColor } from "@/lib/format";
import { useTaxonomyManagerStyles } from "./styles/useTaxonomyManagerStyles";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  topics: Topic[];
}

interface QuizSummary {
  id: string;
  title: string;
  quizOrder: number;
  difficulty: string;
  topics?: { id: string }[];
  _count?: { questions: number };
}

interface QuizQuestionDetail {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
}

interface QuizDetail {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  questions?: QuizQuestionDetail[];
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  exams?: Exam[];
  parentTopics?: Topic[];
  subtopics?: Topic[];
  quizzes?: QuizSummary[];
  _count?: { quizzes: number; questions: number };
}

interface FlatTopic extends Topic {
  displayType: string;
}

export function TaxonomyManager({ view }: { view: "exams" | "main-topics" | "subtopics" }) {
  const styles = useTaxonomyManagerStyles();
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Creation/Edit Dialog Controls
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  
  // Bulk Linking Dialog Controls
  const [examLinkDialogOpen, setExamLinkDialogOpen] = useState(false);
  const [topicLinkDialogOpen, setTopicLinkDialogOpen] = useState(false);
  const [quizLinkDialogOpen, setQuizLinkDialogOpen] = useState(false);

  // Reusable Fluent UI Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: '', description: '', onConfirm: async () => {} });

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

  // Pagination & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const examsRes = await fetch("/api/admin/exams");
      const examsData = await examsRes.json();
      const validExams = Array.isArray(examsData) ? examsData : [];
      setExams(validExams);
      
      const topicsRes = await fetch("/api/admin/topics?all=true");
      const topicsData = await topicsRes.json();
      const validTopics = Array.isArray(topicsData) ? topicsData : [];
      setTopics(validTopics);

      const quizzesRes = await fetch("/api/admin/quizzes");
      const quizzesData = await quizzesRes.json();
      const validQuizzes = Array.isArray(quizzesData) ? quizzesData : [];
      setAllQuizzes(validQuizzes);

      const flattened: FlatTopic[] = [];
      validTopics.forEach((t: Topic) => {
        const isSub = t.parentTopics && t.parentTopics.length > 0;
        if (isSub) {
          const parentNames = t.parentTopics?.map((p: Topic) => p.title).join(", ") || "Unknown";
          flattened.push({ ...t, displayType: `Subtopic (of: ${parentNames})` });
        } else {
          const examNames = t.exams?.map((e: Exam) => e.title).join(", ") || "Standalone";
          flattened.push({ ...t, displayType: `Main Topic (Exam: ${examNames})` });
        }
      });
      setFlatTopics(flattened);
    } catch (e) {
      console.error("fetchData failed:", e);
      setExams([]);
      setTopics([]);
      setAllQuizzes([]);
      setFlatTopics([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchData();
      if (!cancelled) {
        // fetchData handles its own loading state
      }
    })();
    return () => { cancelled = true; };
  }, []);


  const triggerConfirm = useCallback((title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  }, []);

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
        await fetchData();
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
              await fetchData();
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

  const handleSaveExam = async () => {
    setLoading(true);
    const url = examForm.id ? `/api/admin/exams/${examForm.id}` : "/api/admin/exams";
    const method = examForm.id ? "PUT" : "POST";
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(examForm)
    });
    setExamDialogOpen(false);
    await fetchData();
  };

  // Bulk links exams with standalone main topics
  const handleSaveExamLinks = async () => {
    if (!linkExamId) return;
    setLoading(true);
    const url = `/api/admin/exams/${linkExamId}`;
    const targetExam = exams.find(e => e.id === linkExamId);
    if (!targetExam) return;

    const existingIds = targetExam.topics?.map(t => t.id) || [];
    const combinedIds = Array.from(new Set([...existingIds, ...selectedTopicIds]));

    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: targetExam.title,
        description: targetExam.description,
        topicIds: combinedIds
      })
    });
    setExamLinkDialogOpen(false);
    await fetchData();
  };

  // Bulk links main topics with standalone subtopics
  const handleSaveTopicLinks = async () => {
    if (!linkTopicId) return;
    setLoading(true);
    const url = `/api/admin/topics/${linkTopicId}`;
    const targetTopic = topics.find(t => t.id === linkTopicId) || flatTopics.find(t => t.id === linkTopicId);
    if (!targetTopic) return;

    const existingIds = targetTopic.subtopics?.map(t => t.id) || [];
    const combinedIds = Array.from(new Set([...existingIds, ...selectedSubtopicIds]));

    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: targetTopic.title,
        description: targetTopic.description,
        subtopicIds: combinedIds
      })
    });
    setTopicLinkDialogOpen(false);
    await fetchData();
  };

  // Bulk links quizzes to a specific subtopic
  const handleSaveQuizLinks = async () => {
    if (!linkTopicId) return;
    setLoading(true);
    const targetTopic = topics.find(t => t.id === linkTopicId) || flatTopics.find(t => t.id === linkTopicId);
    if (!targetTopic) return;

    const existingIds = targetTopic.quizzes?.map(q => q.id) || [];
    const combinedIds = Array.from(new Set([...existingIds, ...selectedQuizIds]));

    await fetch(`/api/admin/topics/${linkTopicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: targetTopic.title,
        description: targetTopic.description,
        quizIds: combinedIds
      })
    });
    setQuizLinkDialogOpen(false);
    await fetchData();
  };

  const handleSaveTopic = async () => {
    setLoading(true);
    const url = topicForm.id ? `/api/admin/topics/${topicForm.id}` : "/api/admin/topics";
    const method = topicForm.id ? "PUT" : "POST";
    
    const payload = {
      title: topicForm.title,
      description: topicForm.description,
      examId: topicForm.examId || undefined,
      parentId: topicForm.parentId || undefined
    };
    
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setTopicDialogOpen(false);
    await fetchData();
  };

  const handleDeleteExam = useCallback((id: string, name: string) => {
    triggerConfirm(
      "Delete Exam",
      `Are you sure you want to permanently delete "${name}"? This action cannot be undone and will delete all topics linked under it.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
        await fetchData();
      }
    );
  }, [triggerConfirm]);

  const handleDeleteTopic = useCallback((id: string, name: string) => {
    triggerConfirm(
      "Delete Topic",
      `Are you sure you want to permanently delete the topic "${name}"? This will delete all subtopics nested under it.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/topics/${id}`, { method: "DELETE" });
        await fetchData();
      }
    );
  }, [triggerConfirm]);

  const handleDeleteQuiz = (id: string, name: string) => {
    triggerConfirm(
      "Delete Quiz",
      `Are you sure you want to permanently delete the quiz "${name}"? This will delete all attempts and questions associated with it.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
        await fetchData();
      }
    );
  };

  const handleUnlinkTopicFromExam = (topicId: string, topicName: string, examName: string) => {
    triggerConfirm(
      "Unlink Topic",
      `Are you sure you want to unlink "${topicName}" from the exam "${examName}"? It will become a standalone topic.`,
      async () => {
        if (!selectedExamId) return;
        setLoading(true);
        const exam = exams.find(e => e.id === selectedExamId);
        if (!exam) return;
        const updatedTopicIds = exam.topics.filter(t => t.id !== topicId).map(t => t.id);
        await fetch(`/api/admin/exams/${selectedExamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: exam.title,
            description: exam.description,
            topicIds: updatedTopicIds
          })
        });
        await fetchData();
      }
    );
  };

  const handleUnlinkSubtopicFromParent = (subtopicId: string, subtopicName: string, parentName: string) => {
    triggerConfirm(
      "Unlink Subtopic",
      `Are you sure you want to unlink "${subtopicName}" from the parent topic "${parentName}"? It will become a standalone topic.`,
      async () => {
        if (!selectedTopicId) return;
        setLoading(true);
        const parentTopic = topics.find(t => t.id === selectedTopicId);
        if (!parentTopic) return;
        const updatedSubtopicIds = parentTopic.subtopics?.filter(t => t.id !== subtopicId).map(t => t.id) || [];
        await fetch(`/api/admin/topics/${selectedTopicId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parentTopic.title,
            description: parentTopic.description,
            subtopicIds: updatedSubtopicIds
          })
        });
        await fetchData();
      }
    );
  };

  const handleUnlinkQuizFromSubtopic = (quizId: string, quizTitle: string, subtopicName: string) => {
    triggerConfirm(
      "Unlink Quiz",
      `Are you sure you want to unlink the quiz "${quizTitle}" from the subtopic "${subtopicName}"?`,
      async () => {
        if (!selectedTopicId) return;
        setLoading(true);
        const subtopic = topics.find(t => t.id === selectedTopicId) || flatTopics.find(t => t.id === selectedTopicId);
        if (!subtopic) return;
        const updatedQuizIds = subtopic.quizzes?.filter(q => q.id !== quizId).map(q => q.id) || [];
        await fetch(`/api/admin/topics/${selectedTopicId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: subtopic.title,
            description: subtopic.description,
            quizIds: updatedQuizIds
          })
        });
        await fetchData();
      }
    );
  };

  const openNewTopicDialog = (examId = '', parentId = '') => {
    setTopicForm({ id: '', title: '', description: '', examId, parentId });
    setError(null);
    setTopicDialogOpen(true);
  };

  const openNewQuizDialog = (topicId: string) => {
    setQuizForm({ id: '', title: '', quizOrder: '', topicId, difficulty: 'Medium' });
    setQuizDialogOpen(true);
  };

  const renderDifficultyBadge = (difficulty: string) => {
    return <Badge color={difficultyColor(difficulty)} appearance="filled">{difficulty}</Badge>;
  };

  const examColumns = useMemo<TableColumnDefinition<Exam>[]>(() => [
    createTableColumn<Exam>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Exam Title',
      renderCell: (item) => (
        <Tooltip content="Click to view details" relationship="label">
          <Button 
            appearance="transparent" 
            className={styles.examTitleButton}
            onClick={() => setSelectedExamId(item.id)}
          >
            {item.title}
          </Button>
        </Tooltip>
      ),
    }),
    createTableColumn<Exam>({
      columnId: 'description',
      renderHeaderCell: () => 'Description',
      renderCell: (item) => (
        <Text className={styles.cellDescriptionText}>
          {item.description || <span className={styles.cellDescriptionFallback}>No description</span>}
        </Text>
      ),
    }),
    createTableColumn<Exam>({
      columnId: 'topicsCount',
      renderHeaderCell: () => 'Topics',
      renderCell: (item) => {
        const subtopicCount = item.topics?.reduce((acc, t) => {
          const fullTopic = topics.find(top => top.id === t.id);
          return acc + (fullTopic?.subtopics?.length || 0);
        }, 0) || 0;

        return (
          <div className={styles.topicsCountContainer}>
            <BookOpen24Regular className={styles.bookOpenIcon} />
            <Text>{item.topics?.length || 0} Topics • {subtopicCount} Subtopics</Text>
          </div>
        );
      },
    }),
    createTableColumn<Exam>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small" appearance="subtle" icon={<MoreHorizontal20Regular />} aria-label="More actions" />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Add20Regular />} onClick={() => openNewTopicDialog(item.id, '')}>Add Main Topic</MenuItem>
              <MenuItem icon={<Link20Regular />} onClick={() => {
                setLinkExamId(item.id);
                setSelectedTopicIds([]);
                setExamLinkDialogOpen(true);
              }}>Link Topics</MenuItem>
              <MenuItem icon={<Edit20Regular />} onClick={() => {
                setExamForm({ id: item.id, title: item.title, description: item.description || '' });
                setExamDialogOpen(true);
              }}>Edit Exam</MenuItem>
              <MenuItem icon={<Delete20Regular />} onClick={() => handleDeleteExam(item.id, item.title)}>Delete Exam</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      ),
    }),
   ], [handleDeleteExam, topics, styles]);

  const topicColumns = useMemo<TableColumnDefinition<FlatTopic>[]>(() => [
    createTableColumn<FlatTopic>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Topic Title',
      renderCell: (item) => (
        <Tooltip content="Click to view details" relationship="label">
          <Button 
            appearance="transparent" 
            className={styles.topicTitleButton}
            onClick={() => setSelectedTopicId(item.id)}
          >
            {item.title}
          </Button>
        </Tooltip>
      ),
    }),
    createTableColumn<FlatTopic>({
      columnId: 'displayType',
      renderHeaderCell: () => 'Hierarchy Level',
      renderCell: (item) => (
        <div className={styles.displayTypeContainer}>
          {item.parentTopics && item.parentTopics.length > 0 && <ChevronRight20Regular className={styles.chevronIcon} />}
          <Text className={styles.displayTypeText}>{item.displayType}</Text>
        </div>
      ),
    }),
    createTableColumn<FlatTopic>({
      columnId: 'stats',
      renderHeaderCell: () => 'Stats',
      renderCell: (item) => (
        <div className={styles.statsContainer}>
          <DocumentDatabase24Regular className={styles.documentDatabaseIcon} />
          <Text>{item._count?.quizzes || 0} Quizzes</Text>
        </div>
      ),
    }),
    createTableColumn<FlatTopic>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (item) => (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small" appearance="subtle" icon={<MoreHorizontal20Regular />} aria-label="More actions" />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {(!item.parentTopics || item.parentTopics.length === 0) ? (
                <>
                  <MenuItem icon={<Branch20Regular />} onClick={() => openNewTopicDialog('', item.id)}>Add Sub Topic</MenuItem>
                  <MenuItem icon={<Link20Regular />} onClick={() => {
                    setLinkTopicId(item.id);
                    setSelectedSubtopicIds([]);
                    setTopicLinkDialogOpen(true);
                  }}>Link Sub Topics</MenuItem>
                </>
              ) : (
                <MenuItem icon={<Link20Regular />} onClick={() => {
                  setLinkTopicId(item.id);
                  setSelectedQuizIds([]);
                  setQuizLinkDialogOpen(true);
                }}>Link Quizzes</MenuItem>
              )}
              <MenuItem icon={<Edit20Regular />} onClick={() => {
                setTopicForm({ id: item.id, title: item.title, description: item.description || '', examId: '', parentId: item.parentTopics?.[0]?.id || '' });
                setTopicDialogOpen(true);
              }}>Edit Topic</MenuItem>
              <MenuItem icon={<Delete20Regular />} onClick={() => handleDeleteTopic(item.id, item.title)}>Delete Topic</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )
    }),
   ], [handleDeleteTopic, styles]);

  // Filters for linking available items in Combobox
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

  const activeExam = exams.find(e => e.id === selectedExamId);
  const activeTopic = topics.find(t => t.id === selectedTopicId) || flatTopics.find(t => t.id === selectedTopicId);

  // Real-time Filtering and Search logic
  const filteredExams = exams.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayTopics = view === "main-topics" 
    ? flatTopics.filter(t => !t.parentTopics || t.parentTopics.length === 0) 
    : flatTopics.filter(t => t.parentTopics && t.parentTopics.length > 0);

  const filteredTopics = displayTopics.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalItems = view === "exams" ? filteredExams.length : filteredTopics.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Safety page bounds check
  useEffect(() => {
    if (currentPage > totalPages) {
      // Reset pagination when current page is out of bounds.
      queueMicrotask(() => setCurrentPage(1));
    }
  }, [totalPages, currentPage]);



  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <Spinner size="huge" label="Loading taxonomy..." />
    </div>
  );

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      
      {/* EXAMS VIEW */}
      {view === "exams" && (
        <>
          <div className={styles.viewHeader}>
            <div>
              <Text size={700} weight="bold" className={styles.viewTitleText}>Exams ({filteredExams.length})</Text>
              <Text block size={200} className={styles.viewSubtitleText}>Manage the top-level exams representing major categories of your curriculum.</Text>
            </div>
            
            <div className={styles.viewHeaderActions}>
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button size="small" icon={<Filter20Regular />}>Filter</Button>
                </PopoverTrigger>
                <PopoverSurface className={styles.filterPopover}>
                  <Text size={300} weight="semibold">Search Filters</Text>
                  <Field label="Search Title/Description">
                    <Input 
                      placeholder="Type search terms..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </Field>
                </PopoverSurface>
              </Popover>
              <Tooltip content="Create a new Exam category" relationship="label">
                <Button size="small" appearance="primary" icon={<Add20Regular />} onClick={() => {
                  setExamForm({ id: '', title: '', description: '' });
                  setExamDialogOpen(true);
                }}>Add Exam</Button>
              </Tooltip>
            </div>
          </div>
          
          {filteredExams.length === 0 ? (
             <NoData 
               title="No Exams Found" 
               description="Create an exam category to start structuring your topics and subtopics." 
               icon="warning"
               action={<Button size="small" appearance="primary" icon={<Add20Regular />} onClick={() => {
                 setExamForm({ id: '', title: '', description: '' });
                 setExamDialogOpen(true);
               }}>Create First Exam</Button>}
             />
           ) : (
            <Card className={styles.dataGridCard}>
              <div className={styles.scrollContainer}>
                <DataGrid items={paginatedExams} columns={examColumns} className={styles.examDataGrid}>
                  <DataGridHeader className={styles.dataGridHeader}>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell className={styles.dataGridHeaderCell}>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<Exam>>
                    {({ item, rowId }) => (
                      <DataGridRow<Exam> key={rowId} className={styles.dataGridRow}>
                        {({ renderCell }) => (
                          <DataGridCell className={styles.dataGridCell}>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>

              {/* PAGINATION FOOTER */}
              <div className={styles.paginationFooter}>
                <div className={styles.pageSizeSelector}>
                  <Text size={200} className={styles.paginationLabel}>Show</Text>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    size="small"
                    className={styles.fullWidthSelect}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <Text size={200} className={styles.paginationLabel}>entries</Text>
                </div>

                <Text size={200} className={styles.paginationLabel}>
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </Text>

                <div className={styles.paginationNav}>
                  <Button 
                    size="small" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="small" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>

            </Card>
          )}
        </>
      )}

      {/* TOPICS VIEW */}
      {(view === "main-topics" || view === "subtopics") && (
        <>
          <div className={styles.viewHeader}>
            <div>
              <Text size={700} weight="bold" className={styles.viewTitleText}>
                {view === "main-topics" ? "Main Topics" : "Sub Topics"} ({filteredTopics.length})
              </Text>
              <Text block size={200} className={styles.viewSubtitleText}>
                {view === "main-topics" 
                  ? "Manage top-level topic nodes under Exams or Standalone Topics." 
                  : "Manage fine-grained subtopics nested under Main Topics."}
              </Text>
            </div>
            
            <div className={styles.viewHeaderActions}>
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button size="small" icon={<Filter20Regular />}>Filter</Button>
                </PopoverTrigger>
                <PopoverSurface className={styles.filterPopover}>
                  <Text size={300} weight="semibold">Search Filters</Text>
                  <Field label="Search Title/Description">
                    <Input 
                      placeholder="Type search terms..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </Field>
                </PopoverSurface>
              </Popover>
              {view === "main-topics" ? (
                <Tooltip content="Create a topic not bound to any Exam" relationship="label">
                  <Button size="small" appearance="primary" icon={<Add20Regular />} onClick={() => openNewTopicDialog('', '')}>Add Standalone Topic</Button>
                </Tooltip>
              ) : (
                <Tooltip content="Create a new Sub Topic" relationship="label">
                  <Button size="small" appearance="primary" icon={<Add20Regular />} onClick={() => openNewTopicDialog('', '')}>Add Sub Topic</Button>
                </Tooltip>
              )}
            </div>
          </div>
          
          {filteredTopics.length === 0 ? (
             <NoData 
               title={`No ${view === "main-topics" ? "Main Topics" : "Sub Topics"} Found`}
               description={view === "main-topics" 
                 ? 'Create Standalone Topics here, or add main topics to specific Exams from the Exams tab.' 
                 : 'Add subtopics directly here, or click the branch icon on any Main Topic in the Main Topics tab.'}
               icon="warning"
               action={<Button 
                 size="small" 
                 appearance="primary" 
                 icon={<Add20Regular />} 
                 onClick={() => openNewTopicDialog('', '')}
               >
                 Create First {view === "main-topics" ? "Main Topic" : "Sub Topic"}
               </Button>}
             />
           ) : (
            <Card className={styles.dataGridCard}>
              <div className={styles.scrollContainer}>
                <DataGrid items={paginatedTopics} columns={topicColumns} className={styles.topicDataGrid}>
                  <DataGridHeader className={styles.dataGridHeader}>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell className={styles.dataGridHeaderCell}>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<FlatTopic>>
                    {({ item, rowId }) => (
                      <DataGridRow<FlatTopic> key={rowId} className={styles.dataGridRow}>
                        {({ renderCell }) => (
                          <DataGridCell className={styles.dataGridCell}>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>

              {/* PAGINATION FOOTER */}
              <div className={styles.paginationFooter}>
                <div className={styles.pageSizeSelector}>
                  <Text size={200} className={styles.paginationLabel}>Show</Text>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    size="small"
                    className={styles.fullWidthSelect}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <Text size={200} className={styles.paginationLabel}>entries</Text>
                </div>

                <Text size={200} className={styles.paginationLabel}>
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </Text>

                <div className={styles.paginationNav}>
                  <Button 
                    size="small" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="small" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>

            </Card>
          )}
        </>
      )}

      {/* Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={(e, data) => setExamDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>{examForm.id ? "Edit Exam" : "Add Exam"}</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Exam Title" required>
                <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className={styles.fullWidthInput} />
              </Field>
              <Field label="Description">
                <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} className={styles.fullWidthTextarea} />
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveExam} disabled={!examForm.title}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Bulk Link Standalone Topics to Exam Dialog */}
      <Dialog open={examLinkDialogOpen} onOpenChange={(e, data) => setExamLinkDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Main Topics</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Select Standalone Main Topics to Associate with Exam">
                <Combobox 
                  multiselect
                  selectedOptions={selectedTopicIds}
                  onOptionSelect={(e, data) => setSelectedTopicIds(data.selectedOptions)}
                  value={selectedTopicIds.map(id => flatTopics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select topics..."
                  className={styles.fullWidthCombobox}
                >
                  {availableMainTopics.map(t => (
                    <Option key={t.id} value={t.id} text={t.title}>{t.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveExamLinks}>Save Associations</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Bulk Link Subtopics to Main Topic Dialog */}
      <Dialog open={topicLinkDialogOpen} onOpenChange={(e, data) => setTopicLinkDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Sub Topics</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Select Standalone Sub Topics to Link to Main Topic">
                <Combobox 
                  multiselect
                  selectedOptions={selectedSubtopicIds}
                  onOptionSelect={(e, data) => setSelectedSubtopicIds(data.selectedOptions)}
                  value={selectedSubtopicIds.map(id => flatTopics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select subtopics..."
                  className={styles.fullWidthCombobox}
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
              <Button appearance="primary" onClick={handleSaveTopicLinks}>Save Associations</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Bulk Link Quizzes Dialog */}
      <Dialog open={quizLinkDialogOpen} onOpenChange={(e, data) => setQuizLinkDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Quizzes</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Select Existing Quizzes to pull into this Sub Topic">
                <Combobox 
                  multiselect
                  selectedOptions={selectedQuizIds}
                  onOptionSelect={(e, data) => setSelectedQuizIds(data.selectedOptions)}
                  value={selectedQuizIds.map(id => allQuizzes.find(q => q.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select quizzes..."
                  className={styles.fullWidthCombobox}
                >
                  {availableQuizzes.map(q => (
                    <Option key={q.id} value={q.id} text={q.title}>{q.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveQuizLinks}>Save Associations</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Create Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={(e, data) => setQuizDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurfaceQuizAI}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              <div className={styles.quizAIDialogTitleRow}>
                <Sparkle20Regular className={styles.sparkleIcon} />
                Generate Quiz with AI
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContentPadTop}>
              <GenerateQuizForm 
                initialTopicId={quizForm.topicId}
                onSuccess={async () => {
                  await fetchData();
                  setQuizDialogOpen(false);
                }} 
              />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Topic Dialog (Simplified independent creation dialog, no classifications / linking required) */}
      <Dialog open={topicDialogOpen} onOpenChange={(e, data) => setTopicDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {topicForm.id ? "Edit Topic Settings" : (topicForm.parentId ? "Add Sub Topic" : (topicForm.examId ? "Add Main Topic" : "Add Topic"))}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Field label="Topic Title" required>
                <Input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} className={styles.fullWidthInput} />
              </Field>
              <Field label="Description">
                <Textarea value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} className={styles.fullWidthTextarea} />
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveTopic} disabled={!topicForm.title}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Exam Detail Drawer */}
      <OverlayDrawer 
        position="end" 
        open={!!selectedExamId} 
        onOpenChange={(_, data) => setSelectedExamId(data.open ? selectedExamId : null)}
        className={styles.overlayDrawer}
      >
        <DrawerHeader className={styles.drawerHeader}>
          <DrawerHeaderTitle 
            action={
              <Button 
                appearance="subtle" 
                icon={<Dismiss20Regular />}
                onClick={() => setSelectedExamId(null)}
                aria-label="Close"
              />
            }
          >
            <div className={styles.drawerHeaderContent}>
              <Text size={500} weight="bold" className={styles.drawerTitleText}>{activeExam?.title}</Text>
              <Text size={200} className={styles.drawerDescriptionText}>
                {activeExam?.description || <span className={styles.drawerDescriptionFallback}>No description provided.</span>}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className={styles.drawerBody}>
           
          <div>
            <div className={styles.sectionHeader}>
              <Text size={400} weight="semibold" className={styles.sectionHeaderTitle}>Linked Main Topics ({activeExam?.topics?.length || 0})</Text>
              {activeExam && (
                <Button 
                  size="small" 
                  appearance="outline" 
                  icon={<Link20Regular />}
                  onClick={() => {
                    setLinkExamId(activeExam.id);
                    setSelectedTopicIds([]);
                    setExamLinkDialogOpen(true);
                  }}
                >
                  Link Topics
                </Button>
              )}
            </div>
            
            {activeExam?.topics && activeExam.topics.length > 0 ? (
              <div className={styles.linkedList}>
                {activeExam.topics.map(t => (
                  <Card key={t.id} className={styles.linkedItemCard}>
                    <div className={styles.linkedItemTextContent}>
                      <Text weight="semibold" className={styles.linkedItemTitle}>{t.title}</Text>
                    </div>
                    <Tooltip content="Unlink from Exam" relationship="label">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<LinkDismiss20Regular />}
                        className={styles.unlinkButton}
                        onClick={() => handleUnlinkTopicFromExam(t.id, t.title, activeExam?.title || '')}
                      />
                    </Tooltip>
                  </Card>
                ))}
              </div>
              ) : (
                <NoData title="No topics linked to this exam." icon="book" compact={true} />
             )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* Topic/Subtopic Detail Drawer */}
       <OverlayDrawer 
         position="end" 
         open={!!selectedTopicId} 
         onOpenChange={(_, data) => setSelectedTopicId(data.open ? selectedTopicId : null)}
         className={styles.overlayDrawer}
       >
         <DrawerHeader className={styles.drawerHeader}>
           <DrawerHeaderTitle 
             action={
               <Button 
                 appearance="subtle" 
                 icon={<Dismiss20Regular />}
                 onClick={() => setSelectedTopicId(null)}
                 aria-label="Close"
               />
             }
           >
             <div className={styles.drawerHeaderContent}>
               <div className={styles.drawerTitleRow}>
                 <Text size={500} weight="bold" className={styles.drawerTitleText}>{activeTopic?.title}</Text>
               </div>
               <Text size={200} className={styles.drawerDescriptionText}>
                 {activeTopic?.description || <span className={styles.drawerDescriptionFallback}>No description provided.</span>}
               </Text>
             </div>
           </DrawerHeaderTitle>
         </DrawerHeader>
         <DrawerBody className={styles.drawerBody}>
           
           {/* Main Topic (no parentTopics) => shows linked subtopics */}
           {activeTopic && (!activeTopic.parentTopics || activeTopic.parentTopics.length === 0) ? (
             <div>
               <div className={styles.sectionHeader}>
                 <Text size={400} weight="semibold" className={styles.sectionHeaderTitle}>Linked Subtopics ({activeTopic?.subtopics?.length || 0})</Text>
                 <Button 
                   size="small" 
                   appearance="outline" 
                   icon={<Link20Regular />}
                   onClick={() => {
                     setLinkTopicId(activeTopic.id);
                     setSelectedSubtopicIds([]);
                     setTopicLinkDialogOpen(true);
                   }}
                 >
                   Link Sub Topics
                 </Button>
               </div>
               
               {activeTopic?.subtopics && activeTopic.subtopics.length > 0 ? (
                 <div className={styles.linkedList}>
                   {activeTopic.subtopics.map(t => (
                     <Card key={t.id} className={styles.linkedItemCard}>
                       <div className={styles.linkedItemTextContent}>
                         <Text weight="semibold" className={styles.linkedItemTitle}>{t.title}</Text>
                       </div>
                       <Tooltip content="Unlink from Topic" relationship="label">
                         <Button 
                           size="small" 
                           appearance="subtle" 
                           icon={<LinkDismiss20Regular />}
                           className={styles.unlinkButton}
                           onClick={() => handleUnlinkSubtopicFromParent(t.id, t.title, activeTopic?.title || '')}
                         />
                       </Tooltip>
                     </Card>
                   ))}
                 </div>
                ) : (
                  <NoData title="No subtopics linked to this topic." icon="book" compact={true} />
                )}
             </div>
           ) : (
             /* Sub Topic (has parentTopics) => shows linked quizzes */
             <div>
                <div className={styles.sectionHeaderWrap}>
                 <Text size={400} weight="semibold" className={styles.sectionHeaderTitle}>Linked Quizzes ({activeTopic?.quizzes?.length || 0})</Text>
                 <div className={styles.quizzesActionButtons}>
                   <Button 
                     size="small" 
                     appearance="outline" 
                     icon={<Link20Regular />}
                     onClick={() => {
                       if (activeTopic) {
                         setLinkTopicId(activeTopic.id);
                         setSelectedQuizIds([]);
                         setQuizLinkDialogOpen(true);
                       }
                     }}
                   >
                     Link Quizzes
                   </Button>
                   <Button 
                     size="small" 
                     appearance="primary" 
                     icon={<Add20Regular />}
                     onClick={() => activeTopic && openNewQuizDialog(activeTopic.id)}
                   >
                     Create Quiz
                   </Button>
                 </div>
               </div>
               
               {activeTopic?.quizzes && activeTopic.quizzes.length > 0 ? (
                 <div className={styles.linkedList}>
                   {activeTopic.quizzes.map(q => (
                     <Card key={q.id} className={styles.linkedItemCard}>
                       <div className={styles.linkedItemTextContent}>
                         <Tooltip content="Click to view questions" relationship="label">
                           <LinkButton
                             appearance="transparent"
                             className={styles.quizLinkButton}
                             href={`/admin/manage/quizzes/${q.id}/questions`}
                           >
                             {q.title}
                           </LinkButton>
                         </Tooltip>
                         <Text size={100} className={styles.quizMetaText}>Order: #{q.quizOrder} • {q._count?.questions || 0} Questions</Text>
                       </div>
                       
                       <div className={styles.quizActionButtons}>
                         {renderDifficultyBadge(q.difficulty)}
                         <Tooltip content="Unlink Quiz" relationship="label">
                           <Button 
                             size="small" 
                             appearance="subtle" 
                             icon={<LinkDismiss20Regular />}
                             className={styles.quizUnlinkButton}
                             onClick={() => handleUnlinkQuizFromSubtopic(q.id, q.title, activeTopic?.title || '')}
                           />
                         </Tooltip>
                         <Tooltip content="Delete Quiz permanently" relationship="label">
                           <Button 
                             size="small" 
                             appearance="subtle" 
                             icon={<Delete20Regular />}
                             className={styles.unlinkButton}
                             onClick={() => handleDeleteQuiz(q.id, q.title)}
                           />
                         </Tooltip>
                       </div>
                     </Card>
                   ))}
                 </div>
                ) : (
                  <NoData title="No quizzes linked to this subtopic." icon="book" compact={true} />
                )}
             </div>
           )}
         </DrawerBody>
       </OverlayDrawer>

      {/* Reusable Fluent UI Confirmation Dialog */}
      {/* ── Quiz Detail Drawer ── */}
      <OverlayDrawer
        position="end"
        open={!!selectedQuizId}
        onOpenChange={(_, d) => setSelectedQuizId(d.open ? selectedQuizId : null)}
        className={styles.overlayDrawerQuiz}
      >
        <DrawerHeader className={styles.drawerHeader}>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={() => setSelectedQuizId(null)} aria-label="Close" />
            }
          >
            <div className={styles.drawerHeaderContent}>
              <div className={styles.drawerTitleRow}>
                <Text size={500} weight="bold" className={styles.drawerTitleText}>{activeQuizDetail?.title}</Text>
                {activeQuizDetail && <Badge appearance="filled" color={activeQuizDetail.difficulty === "Easy" ? "success" : activeQuizDetail.difficulty === "Hard" ? "danger" : "warning"}>{activeQuizDetail.difficulty}</Badge>}
              </div>
              <Text size={200} className={styles.quizOrderText}>
                Order #{activeQuizDetail?.quizOrder} · {activeQuizDetail?.questions?.length || 0} questions
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.drawerBody}>
          {/* Quiz Questions management in drawer */}
          <div>
            <div className={styles.sectionHeaderQuestions}>
              <Text size={400} weight="semibold" className={styles.sectionHeaderTitle}>
                Questions ({activeQuizDetail?.questions?.length || 0})
              </Text>
              <Button size="small" icon={<Add20Regular />} onClick={handleOpenAddQuestion}>
                Add Question
              </Button>
            </div>

            {activeQuizLoading ? (
              <div className={styles.questionsLoading}>
                <Spinner size="medium" label="Loading questions..." />
              </div>
            ) : activeQuizDetail?.questions && activeQuizDetail.questions.length > 0 ? (
              <div className={styles.linkedList}>
                {activeQuizDetail.questions.map((q: QuizQuestionDetail, idx: number) => (
                  <Card key={q.id} className={styles.questionCard}>
                    <div className={styles.questionHeaderRow}>
                      <Text weight="semibold" size={300} className={styles.questionText}>
                        {idx + 1}. {q.text}
                      </Text>
                      <div className={styles.questionActionButtons}>
                        <Button 
                          size="small" appearance="subtle" icon={<Edit20Regular />} 
                          onClick={() => handleOpenEditQuestion(q)} 
                          aria-label="Edit question"
                        />
                        <Button 
                          size="small" appearance="subtle" icon={<Delete20Regular />} 
                          className={styles.unlinkButton}
                          onClick={() => handleDeleteQuestion(q.id, q.text)} 
                          aria-label="Delete question"
                        />
                      </div>
                    </div>

                    <div className={styles.optionList}>
                      {q.options.map((opt: string, oIdx: number) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <Text 
                            key={oIdx} 
                            size={200} 
                            className={isCorrect ? styles.optionTextCorrect : styles.optionText}
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
               <NoData title="No questions linked." description="Click Add Question to build questions manually." icon="book" compact={true} />
             )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialogOpen} onOpenChange={(_, d) => setQuestionDialogOpen(d.open)}>
        <DialogSurface className={styles.dialogSurfaceQuestion}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {questionForm.id ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogContent className={styles.dialogContentSmallGap}>
              <Field label="Question Text" required>
                <Textarea 
                  value={questionForm.text} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))} 
                  placeholder="Enter the question text..." 
                  className={styles.fullWidthTextarea}
                />
              </Field>

              <div className={styles.optionsGrid}>
                {questionForm.options.map((opt, idx) => (
                  <Field key={idx} label={`Option ${idx + 1}`} required>
                    <Input 
                      value={opt} 
                      onChange={e => handleOptionChange(idx, e.target.value)} 
                      placeholder={`Option ${idx + 1}`}
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required hint="Must match one of the options exactly">
                <Select 
                  value={questionForm.correctAnswer} 
                  onChange={(e, data) => setQuestionForm(prev => ({ ...prev, correctAnswer: data.value }))}
                  className={styles.fullWidthSelect}
                >
                  <option value="">Select correct option...</option>
                  {questionForm.options.filter(Boolean).map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Hint" hint="Optional hint shown to students during quiz">
                <Input 
                  value={questionForm.hint} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, hint: e.target.value }))} 
                  placeholder="e.g. Think about..."
                />
              </Field>

              <Field label="Explanation" required hint="Detailed explanation shown after answering">
                <Textarea 
                  value={questionForm.description} 
                  onChange={e => setQuestionForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Explain why this option is correct..."
                  className={styles.fullWidthTextarea}
                />
              </Field>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSaveQuestion} disabled={!questionForm.text || !questionForm.correctAnswer || !questionForm.description || loading}>
                {loading ? <Spinner size="tiny" /> : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Bulk Link Quizzes Dialog (moving this down below overlays) */}
      <Dialog open={confirmDialog.open} onOpenChange={(e, data) => setConfirmDialog(prev => ({ ...prev, open: data.open }))}>
        <DialogSurface className={styles.dialogSurfaceMax400}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>{confirmDialog.title}</DialogTitle>
            <DialogContent className={styles.dialogContentConfirm}>
              <Text className={styles.confirmDescriptionText}>
                {confirmDialog.description}
              </Text>
            </DialogContent>
            <DialogActions className={styles.dialogActions}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button 
                appearance="primary" 
                className={styles.confirmButtonDestructive}
                onClick={async () => {
                  await confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, open: false }));
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
