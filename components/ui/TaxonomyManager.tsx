"use client";

import { useState, useEffect } from "react";
import { 
  Button, Card, Text, Input, Field, Dialog, DialogTrigger, 
  DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, 
  Spinner, Select, Textarea, Badge, Tooltip,
  Combobox, Option,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  OverlayDrawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
  Popover, PopoverTrigger, PopoverSurface
} from "@fluentui/react-components";
import { 
  Edit20Regular, Delete20Regular, Add20Regular, 
  BookOpen24Regular, DocumentDatabase24Regular, 
  ChevronRight20Regular, Warning48Regular, Branch20Regular,
  MoreHorizontal20Regular, Dismiss20Regular, LinkDismiss20Regular, Link20Regular,
  Filter20Regular, Sparkle20Regular
} from "@fluentui/react-icons";
import { TableColumnDefinition, createTableColumn, DataGrid, DataGridHeader, DataGridHeaderCell, DataGridRow, DataGridBody, DataGridCell } from "@fluentui/react-components";
import { GenerateQuizForm } from "./GenerateQuizForm";
import { LinkButton } from "./LinkButton";

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
  _count?: { questions: number };
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const [activeQuizDetail, setActiveQuizDetail] = useState<any | null>(null);
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
          const parentNames = t.parentTopics?.map((p: any) => p.title).join(", ") || "Unknown";
          flattened.push({ ...t, displayType: `Subtopic (of: ${parentNames})` });
        } else {
          const examNames = t.exams?.map((e: any) => e.title).join(", ") || "Standalone";
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
    fetchData();
  }, []);

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

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
    if (selectedQuizId) {
      loadQuizDetails(selectedQuizId);
    } else {
      setActiveQuizDetail(null);
    }
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

  const handleOpenEditQuestion = (q: any) => {
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
        alert(data.error || "Failed to save question");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving question");
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

  const handleSaveQuiz = async () => {
    setLoading(true);
    const url = quizForm.id ? `/api/admin/quizzes/${quizForm.id}` : "/api/admin/quizzes";
    const method = quizForm.id ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...quizForm,
        quizOrder: quizForm.quizOrder ? parseInt(quizForm.quizOrder) : null
      })
    });
    setQuizDialogOpen(false);
    await fetchData();
  };

  const handleDeleteExam = (id: string, name: string) => {
    triggerConfirm(
      "Delete Exam",
      `Are you sure you want to permanently delete "${name}"? This action cannot be undone and will delete all topics linked under it.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
        await fetchData();
      }
    );
  };

  const handleDeleteTopic = (id: string, name: string) => {
    triggerConfirm(
      "Delete Topic",
      `Are you sure you want to permanently delete the topic "${name}"? This will delete all subtopics nested under it.`,
      async () => {
        setLoading(true);
        await fetch(`/api/admin/topics/${id}`, { method: "DELETE" });
        await fetchData();
      }
    );
  };

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
    setTopicDialogOpen(true);
  };

  const openNewQuizDialog = (topicId: string) => {
    setQuizForm({ id: '', title: '', quizOrder: '', topicId, difficulty: 'Medium' });
    setQuizDialogOpen(true);
  };

  const renderDifficultyBadge = (difficulty: string) => {
    let color: "success" | "warning" | "danger" = "warning";
    if (difficulty.toLowerCase() === "easy") color = "success";
    if (difficulty.toLowerCase() === "hard") color = "danger";
    return <Badge color={color} appearance="filled">{difficulty}</Badge>;
  };

  const examColumns: TableColumnDefinition<Exam>[] = [
    createTableColumn<Exam>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Exam Title',
      renderCell: (item) => (
        <Tooltip content="Click to view details" relationship="label">
          <Button 
            appearance="transparent" 
            style={{ 
              padding: 0, 
              height: 'auto', 
              fontWeight: 'bold', 
              color: '#0078d4', 
              textAlign: 'left',
              justifyContent: 'flex-start',
              minWidth: 'auto'
            }}
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
        <Text style={{ color: '#616161', fontSize: '13px' }}>
          {item.description || <span style={{ fontStyle: 'italic', color: '#b3b3b3' }}>No description</span>}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen24Regular style={{ color: '#0078d4' }} />
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
  ];

  const topicColumns: TableColumnDefinition<FlatTopic>[] = [
    createTableColumn<FlatTopic>({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Topic Title',
      renderCell: (item) => (
        <Tooltip content="Click to view details" relationship="label">
          <Button 
            appearance="transparent" 
            style={{ 
              padding: 0, 
              height: 'auto', 
              fontWeight: 'semibold', 
              color: '#0078d4', 
              textAlign: 'left',
              justifyContent: 'flex-start',
              minWidth: 'auto'
            }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {item.parentTopics && item.parentTopics.length > 0 && <ChevronRight20Regular style={{ color: '#a19f9d' }} />}
          <Text style={{ fontSize: '13px', color: '#616161' }}>{item.displayType}</Text>
        </div>
      ),
    }),
    createTableColumn<FlatTopic>({
      columnId: 'stats',
      renderHeaderCell: () => 'Stats',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DocumentDatabase24Regular style={{ color: '#107c41' }} />
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
                    setSelectedSubtopicIds(item.subtopics?.map(t => t.id) || []);
                    setTopicLinkDialogOpen(true);
                  }}>Link Sub Topics</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem icon={<Add20Regular />} onClick={() => openNewQuizDialog(item.id)}>Create Quiz</MenuItem>
                  <MenuItem icon={<Link20Regular />} onClick={() => {
                    setLinkTopicId(item.id);
                    setSelectedQuizIds(item.quizzes?.map(q => q.id) || []);
                    setQuizLinkDialogOpen(true);
                  }}>Link Existing Quizzes</MenuItem>
                </>
              )}
              <MenuItem icon={<Edit20Regular />} onClick={() => {
                setTopicForm({ 
                  id: item.id, 
                  title: item.title, 
                  description: item.description || '', 
                  examId: '',
                  parentId: ''
                });
                setTopicDialogOpen(true);
              }}>Edit Topic</MenuItem>
              <MenuItem icon={<Delete20Regular />} onClick={() => handleDeleteTopic(item.id, item.title)}>Delete Topic</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      ),
    }),
  ];

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
    !linkTopicId || !q.topics?.some((t: any) => t.id === linkTopicId)
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
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <Spinner size="huge" label="Loading taxonomy..." />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* EXAMS VIEW */}
      {view === "exams" && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text size={700} weight="bold" style={{ color: '#242424' }}>Exams ({filteredExams.length})</Text>
              <Text block size={200} style={{ color: '#616161', marginTop: '4px' }}>Manage the top-level exams representing major categories of your curriculum.</Text>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button size="small" icon={<Filter20Regular />}>Filter</Button>
                </PopoverTrigger>
                <PopoverSurface style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}>
              <Card style={{ 
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)', 
                borderRadius: '12px', 
                border: '1px solid #e0e0e0',
                padding: '40px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '16px',
                maxWidth: '550px',
                width: '100%'
              }}>
                <Warning48Regular style={{ color: '#0078d4' }} />
                <div style={{ textAlign: 'center' }}>
                  <Text size={500} weight="bold" block style={{ color: '#242424', marginBottom: '6px' }}>No Exams Found</Text>
                  <Text size={200} style={{ color: '#616161' }}>Create an exam category to start structuring your topics and subtopics.</Text>
                </div>
                <Button size="small" appearance="primary" icon={<Add20Regular />} onClick={() => {
                  setExamForm({ id: '', title: '', description: '' });
                  setExamDialogOpen(true);
                }}>Create First Exam</Button>
              </Card>
            </div>
          ) : (
            <Card style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px', 
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              padding: 0
            }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <DataGrid items={paginatedExams} columns={examColumns} style={{ minWidth: '800px' }}>
                  <DataGridHeader style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell style={{ padding: '12px 16px', fontWeight: 'bold' }}>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<Exam>>
                    {({ item, rowId }) => (
                      <DataGridRow<Exam> key={rowId} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}>
                        {({ renderCell }) => (
                          <DataGridCell style={{ padding: '16px' }}>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>

              {/* PAGINATION FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #eaeaea', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text size={200} style={{ color: '#616161' }}>Show</Text>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    size="small"
                    style={{ width: '80px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <Text size={200} style={{ color: '#616161' }}>entries</Text>
                </div>

                <Text size={200} style={{ color: '#616161' }}>
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </Text>

                <div style={{ display: 'flex', gap: '8px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text size={700} weight="bold" style={{ color: '#242424' }}>
                {view === "main-topics" ? "Main Topics" : "Sub Topics"} ({filteredTopics.length})
              </Text>
              <Text block size={200} style={{ color: '#616161', marginTop: '4px' }}>
                {view === "main-topics" 
                  ? "Manage top-level topic nodes under Exams or Standalone Topics." 
                  : "Manage fine-grained subtopics nested under Main Topics."}
              </Text>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Popover>
                <PopoverTrigger disableButtonEnhancement>
                  <Button size="small" icon={<Filter20Regular />}>Filter</Button>
                </PopoverTrigger>
                <PopoverSurface style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0' }}>
              <Card style={{ 
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)', 
                borderRadius: '12px', 
                border: '1px solid #e0e0e0',
                padding: '40px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '16px',
                maxWidth: '550px',
                width: '100%'
              }}>
                <Warning48Regular style={{ color: '#0078d4' }} />
                <div style={{ textAlign: 'center' }}>
                  <Text size={500} weight="bold" block style={{ color: '#242424', marginBottom: '6px' }}>
                    No {view === "main-topics" ? "Main Topics" : "Sub Topics"} Found
                  </Text>
                  <Text size={200} style={{ color: '#616161' }}>
                    {view === "main-topics" 
                      ? 'Create Standalone Topics here, or add main topics to specific Exams from the Exams tab.' 
                      : 'Add subtopics directly here, or click the branch icon on any Main Topic in the Main Topics tab.'}
                  </Text>
                </div>
                <Button 
                  size="small" 
                  appearance="primary" 
                  icon={<Add20Regular />} 
                  onClick={() => openNewTopicDialog('', '')}
                >
                  Create First {view === "main-topics" ? "Main Topic" : "Sub Topic"}
                </Button>
              </Card>
            </div>
          ) : (
            <Card style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              borderRadius: '12px', 
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              padding: 0
            }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <DataGrid items={paginatedTopics} columns={topicColumns} style={{ minWidth: '900px' }}>
                  <DataGridHeader style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell style={{ padding: '12px 16px', fontWeight: 'bold' }}>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<FlatTopic>>
                    {({ item, rowId }) => (
                      <DataGridRow<FlatTopic> key={rowId} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}>
                        {({ renderCell }) => (
                          <DataGridCell style={{ padding: '16px' }}>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>

              {/* PAGINATION FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #eaeaea', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text size={200} style={{ color: '#616161' }}>Show</Text>
                  <Select 
                    value={pageSize.toString()} 
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    size="small"
                    style={{ width: '80px' }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                  <Text size={200} style={{ color: '#616161' }}>entries</Text>
                </div>

                <Text size={200} style={{ color: '#616161' }}>
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </Text>

                <div style={{ display: 'flex', gap: '8px' }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>{examForm.id ? "Edit Exam" : "Add Exam"}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
              <Field label="Exam Title" required>
                <Input value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} style={{ width: '100%' }} />
              </Field>
              <Field label="Description">
                <Textarea value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} style={{ width: '100%', minHeight: '80px' }} />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Main Topics</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
              <Field label="Select Standalone Main Topics to Associate with Exam">
                <Combobox 
                  multiselect
                  selectedOptions={selectedTopicIds}
                  onOptionSelect={(e, data) => setSelectedTopicIds(data.selectedOptions)}
                  value={selectedTopicIds.map(id => flatTopics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select topics..."
                  style={{ width: '100%' }}
                >
                  {availableMainTopics.map(t => (
                    <Option key={t.id} value={t.id} text={t.title}>{t.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Sub Topics</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
              <Field label="Select Standalone Sub Topics to Link to Main Topic">
                <Combobox 
                  multiselect
                  selectedOptions={selectedSubtopicIds}
                  onOptionSelect={(e, data) => setSelectedSubtopicIds(data.selectedOptions)}
                  value={selectedSubtopicIds.map(id => flatTopics.find(t => t.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select subtopics..."
                  style={{ width: '100%' }}
                >
                  {availableSubtopics.map(t => (
                    <Option key={t.id} value={t.id} text={t.title}>{t.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>Link Existing Quizzes</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
              <Field label="Select Existing Quizzes to pull into this Sub Topic">
                <Combobox 
                  multiselect
                  selectedOptions={selectedQuizIds}
                  onOptionSelect={(e, data) => setSelectedQuizIds(data.selectedOptions)}
                  value={selectedQuizIds.map(id => allQuizzes.find(q => q.id === id)?.title).filter(Boolean).join(", ")}
                  placeholder="Select quizzes..."
                  style={{ width: '100%' }}
                >
                  {availableQuizzes.map(q => (
                    <Option key={q.id} value={q.id} text={q.title}>{q.title}</Option>
                  ))}
                </Combobox>
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
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
        <DialogSurface style={{ borderRadius: "14px", padding: "28px", maxWidth: "640px", width: "100%" }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkle20Regular style={{ color: "#0078d4" }} />
                Generate Quiz with AI
              </div>
            </DialogTitle>
            <DialogContent style={{ paddingTop: "16px" }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
              {topicForm.id ? "Edit Topic Settings" : (topicForm.parentId ? "Add Sub Topic" : (topicForm.examId ? "Add Main Topic" : "Add Topic"))}
            </DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
              <Field label="Topic Title" required>
                <Input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} style={{ width: '100%' }} />
              </Field>
              <Field label="Description">
                <Textarea value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} style={{ width: '100%', minHeight: '80px' }} />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
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
        style={{ width: '550px', maxWidth: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
      >
        <DrawerHeader style={{ borderBottom: '1px solid #eaeaea', padding: '16px 24px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Text size={500} weight="bold" style={{ color: '#242424' }}>{activeExam?.title}</Text>
              <Text size={200} style={{ color: '#616161', fontWeight: 'normal', lineHeight: '1.4' }}>
                {activeExam?.description || <span style={{ fontStyle: 'italic', color: '#b3b3b3' }}>No description provided.</span>}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Text size={400} weight="semibold" style={{ color: '#242424' }}>Linked Main Topics ({activeExam?.topics?.length || 0})</Text>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeExam.topics.map(t => (
                  <Card key={t.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Text weight="semibold" style={{ color: '#242424' }}>{t.title}</Text>
                    </div>
                    <Tooltip content="Unlink from Exam" relationship="label">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<LinkDismiss20Regular />}
                        style={{ color: '#d13438' }}
                        onClick={() => handleUnlinkTopicFromExam(t.id, t.title, activeExam?.title || '')}
                      />
                    </Tooltip>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}>
                <Text style={{ color: '#a19f9d' }}>No topics linked to this exam.</Text>
              </div>
            )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* Topic/Subtopic Detail Drawer */}
      <OverlayDrawer 
        position="end" 
        open={!!selectedTopicId} 
        onOpenChange={(_, data) => setSelectedTopicId(data.open ? selectedTopicId : null)}
        style={{ width: '550px', maxWidth: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
      >
        <DrawerHeader style={{ borderBottom: '1px solid #eaeaea', padding: '16px 24px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text size={500} weight="bold" style={{ color: '#242424' }}>{activeTopic?.title}</Text>
              </div>
              <Text size={200} style={{ color: '#616161', fontWeight: 'normal', lineHeight: '1.4' }}>
                {activeTopic?.description || <span style={{ fontStyle: 'italic', color: '#b3b3b3' }}>No description provided.</span>}
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Topic (no parentTopics) => shows linked subtopics */}
          {activeTopic && (!activeTopic.parentTopics || activeTopic.parentTopics.length === 0) ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text size={400} weight="semibold" style={{ color: '#242424' }}>Linked Subtopics ({activeTopic?.subtopics?.length || 0})</Text>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeTopic.subtopics.map(t => (
                    <Card key={t.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Text weight="semibold" style={{ color: '#242424' }}>{t.title}</Text>
                      </div>
                      <Tooltip content="Unlink from Topic" relationship="label">
                        <Button 
                          size="small" 
                          appearance="subtle" 
                          icon={<LinkDismiss20Regular />}
                          style={{ color: '#d13438' }}
                          onClick={() => handleUnlinkSubtopicFromParent(t.id, t.title, activeTopic?.title || '')}
                        />
                      </Tooltip>
                    </Card>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}>
                  <Text style={{ color: '#a19f9d' }}>No subtopics linked to this topic.</Text>
                </div>
              )}
            </div>
          ) : (
            /* Sub Topic (has parentTopics) => shows linked quizzes */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <Text size={400} weight="semibold" style={{ color: '#242424' }}>Linked Quizzes ({activeTopic?.quizzes?.length || 0})</Text>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeTopic.quizzes.map(q => (
                    <Card key={q.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #f0f0f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Tooltip content="Click to view questions" relationship="label">
                          <LinkButton
                            appearance="transparent"
                            style={{ padding: 0, height: 'auto', fontWeight: 'bold', color: '#0078d4', textAlign: 'left', justifyContent: 'flex-start', minWidth: 'auto' }}
                            href={`/admin/manage/quizzes/${q.id}/questions`}
                          >
                            {q.title}
                          </LinkButton>
                        </Tooltip>
                        <Text size={100} style={{ color: '#616161' }}>Order: #{q.quizOrder} • {q._count?.questions || 0} Questions</Text>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {renderDifficultyBadge(q.difficulty)}
                        <Tooltip content="Unlink Quiz" relationship="label">
                          <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={<LinkDismiss20Regular />}
                            style={{ color: '#616161' }}
                            onClick={() => handleUnlinkQuizFromSubtopic(q.id, q.title, activeTopic?.title || '')}
                          />
                        </Tooltip>
                        <Tooltip content="Delete Quiz permanently" relationship="label">
                          <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={<Delete20Regular />}
                            style={{ color: '#d13438' }}
                            onClick={() => handleDeleteQuiz(q.id, q.title)}
                          />
                        </Tooltip>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}>
                  <Text style={{ color: '#a19f9d' }}>No quizzes linked to this subtopic.</Text>
                </div>
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
        style={{ width: "500px", maxWidth: "100%", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #eaeaea", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={() => setSelectedQuizId(null)} aria-label="Close" />
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text size={500} weight="bold" style={{ color: "#242424" }}>{activeQuizDetail?.title}</Text>
                {activeQuizDetail && <Badge appearance="filled" color={activeQuizDetail.difficulty === "Easy" ? "success" : activeQuizDetail.difficulty === "Hard" ? "danger" : "warning"}>{activeQuizDetail.difficulty}</Badge>}
              </div>
              <Text size={200} style={{ color: "#6b7280" }}>
                Order #{activeQuizDetail?.quizOrder} · {activeQuizDetail?.questions?.length || 0} questions
              </Text>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quiz Questions management in drawer */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <Text size={400} weight="semibold" style={{ color: "#242424" }}>
                Questions ({activeQuizDetail?.questions?.length || 0})
              </Text>
              <Button size="small" icon={<Add20Regular />} onClick={handleOpenAddQuestion}>
                Add Question
              </Button>
            </div>

            {activeQuizLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                <Spinner size="medium" label="Loading questions..." />
              </div>
            ) : activeQuizDetail?.questions && activeQuizDetail.questions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {activeQuizDetail.questions.map((q: any, idx: number) => (
                  <Card key={q.id} style={{
                    display: "flex", flexDirection: "column", gap: "8px", padding: "16px",
                    border: "1px solid #f0f0f0", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <Text weight="semibold" size={300} style={{ color: "#1f2937", lineHeight: "1.4" }}>
                        {idx + 1}. {q.text}
                      </Text>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <Button 
                          size="small" appearance="subtle" icon={<Edit20Regular />} 
                          onClick={() => handleOpenEditQuestion(q)} 
                          aria-label="Edit question"
                        />
                        <Button 
                          size="small" appearance="subtle" icon={<Delete20Regular />} 
                          style={{ color: "#d13438" }}
                          onClick={() => handleDeleteQuestion(q.id, q.text)} 
                          aria-label="Delete question"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: "2px solid #e5e7eb" }}>
                      {q.options.map((opt: string, oIdx: number) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <Text 
                            key={oIdx} 
                            size={200} 
                            style={{ 
                              color: isCorrect ? "#16a34a" : "#4b5563", 
                              fontWeight: isCorrect ? "bold" : "normal" 
                            }}
                          >
                            {oIdx + 1}. {opt} {isCorrect && "✓"}
                          </Text>
                        );
                      })}
                    </div>

                    {q.hint && (
                      <Text size={100} style={{ color: "#6b7280", fontStyle: "italic" }}>
                        Hint: {q.hint}
                      </Text>
                    )}
                    {q.description && (
                      <Text size={100} style={{ color: "#6b7280" }}>
                        Explanation: {q.description}
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px dashed #d9d9d9" }}>
                <Text style={{ color: "#9ca3af" }}>No questions linked. Click "Add Question" to build questions manually.</Text>
              </div>
            )}
          </div>
        </DrawerBody>
      </OverlayDrawer>

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
                    />
                  </Field>
                ))}
              </div>

              <Field label="Correct Answer" required hint="Must match one of the options exactly">
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
                  style={{ width: "100%", minHeight: "80px" }}
                />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "24px" }}>
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
        <DialogSurface style={{ borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
          <DialogBody>
            <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>{confirmDialog.title}</DialogTitle>
            <DialogContent style={{ paddingTop: '12px' }}>
              <Text style={{ color: '#616161', fontSize: '14px', lineHeight: '1.5' }}>
                {confirmDialog.description}
              </Text>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button 
                appearance="primary" 
                style={{ backgroundColor: '#d13438', borderColor: '#d13438', color: '#ffffff' }}
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
