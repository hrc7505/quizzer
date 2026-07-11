"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, Text, Button, Badge, Accordion,
  AccordionItem, AccordionHeader, AccordionPanel,
  Input, Select, TabList, Tab, Spinner
} from "@fluentui/react-components";
import {
  Search24Regular, Filter24Regular, Grid24Regular, 
  TextBulletListTree24Regular, ArrowRight16Regular, Sparkle24Regular
} from "@fluentui/react-icons";
import Link from "next/link";
import { TopicListProps, TopicData, QuizSummary } from "./interfaces/TopicList.interface";
import { useTopicListStyles } from "./styles/useTopicListStyles";

interface FlattenedQuiz {
  id: string;
  title: string;
  difficulty: string;
  questionsCount: number;
  breadcrumbs: string[];
  examId?: string;
  examTitle?: string;
  topicId: string;
  topicTitle: string;
}

/**
 * Client component to display a hierarchical or grid list of exams, topics, and subtopics.
 * Features live filtering, grid vs. tree view toggling, and infinite scroll pagination.
 */
export function TopicList({ exams, standaloneTopics }: TopicListProps) {
  const styles = useTopicListStyles();
  
  // Navigation & view states
  const [activeTab, setActiveTab] = useState<"grid" | "tree">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  
  // Infinite scroll states
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Flattening Logic ────────────────────────────────────────────────────────
  
  const allQuizzes: FlattenedQuiz[] = [];

  // 1. Quizzes from Exams
  exams.forEach(exam => {
    exam.topics.forEach(topic => {
      // Main topic quizzes
      topic.quizzes.forEach(quiz => {
        allQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questionsCount: quiz._count?.questions || 0,
          breadcrumbs: [exam.title, topic.title],
          examId: exam.id,
          examTitle: exam.title,
          topicId: topic.id,
          topicTitle: topic.title
        });
      });
      // Subtopic quizzes
      topic.subtopics?.forEach(sub => {
        sub.quizzes.forEach(quiz => {
          allQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            difficulty: quiz.difficulty,
            questionsCount: quiz._count?.questions || 0,
            breadcrumbs: [exam.title, topic.title, sub.title],
            examId: exam.id,
            examTitle: exam.title,
            topicId: sub.id,
            topicTitle: sub.title
          });
        });
      });
    });
  });

  // 2. Quizzes from Standalone Topics
  standaloneTopics.forEach(topic => {
    topic.quizzes.forEach(quiz => {
      allQuizzes.push({
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questionsCount: quiz._count?.questions || 0,
        breadcrumbs: ["Standalone", topic.title],
        topicId: topic.id,
        topicTitle: topic.title
      });
    });
    topic.subtopics?.forEach(sub => {
      sub.quizzes.forEach(quiz => {
        allQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questionsCount: quiz._count?.questions || 0,
          breadcrumbs: ["Standalone", topic.title, sub.title],
          topicId: sub.id,
          topicTitle: sub.title
        });
      });
    });
  });

  // ── Filtering Logic ──────────────────────────────────────────────────────────

  const filteredQuizzes = allQuizzes.filter(quiz => {
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.breadcrumbs.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesExam = !examFilter || quiz.examId === examFilter || (examFilter === "standalone" && !quiz.examId);
    const matchesDifficulty = !difficultyFilter || quiz.difficulty === difficultyFilter;

    return matchesSearch && matchesExam && matchesDifficulty;
  });

  const paginatedQuizzes = filteredQuizzes.slice(0, visibleCount);
  const hasMore = filteredQuizzes.length > visibleCount;

  // Reset pagination count on search or filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, examFilter, difficultyFilter]);

  // ── Infinite Scroll Observer ──────────────────────────────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount(prev => prev + 12);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore]);

  // ── Render Helpers ──────────────────────────────────────────────────────────

  const getDifficultyColor = (diff: string): "success" | "warning" | "danger" => {
    if (diff === "Easy") return "success";
    if (diff === "Hard") return "danger";
    return "warning";
  };

  const renderTopic = (topic: TopicData, isSubtopic = false) => (
    <div key={topic.id} style={{ marginBottom: '24px', paddingLeft: isSubtopic ? '24px' : '0' }}>
      <div className={styles.topicHeader} style={{ marginBottom: '16px' }}>
        <Text size={isSubtopic ? 400 : 500} weight="bold" style={{ color: '#1e293b' }}>
          {isSubtopic ? "↳ " : ""}{topic.title}
        </Text>
      </div>
      
      <div className={styles.grid}>
        {topic.quizzes.map(quiz => (
          <Card key={quiz.id} style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}>
            <CardHeader 
              header={<Text weight="semibold" size={300} style={{ color: '#1e293b' }}>{quiz.title}</Text>} 
              action={
                <Badge color={getDifficultyColor(quiz.difficulty)} style={{ borderRadius: '6px' }}>
                  {quiz.difficulty}
                </Badge>
              }
            />
            <div className={styles.cardContent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
              <Text size={200} style={{ color: '#64748b' }}>{quiz._count.questions} questions</Text>
              <Link 
                href={`/quiz/${quiz.id}`} 
                style={{ 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0078d4',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'background-color 0.2s'
                }}
              >
                Start Quiz
              </Link>
            </div>
          </Card>
        ))}
        {topic.quizzes.length === 0 && (
          <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>No quizzes linked to this topic.</Text>
        )}
      </div>
      
      {topic.subtopics && topic.subtopics.length > 0 && (
        <div style={{ marginTop: '24px', borderLeft: '2px solid #f1f5f9', marginLeft: '8px' }}>
          {topic.subtopics.map(sub => renderTopic(sub, true))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Interactive Controls Toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: "16px", backgroundColor: "white", padding: "16px 20px", borderRadius: "16px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
      }}>
        {/* Search & Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, minWidth: "280px" }}>
          <Input
            contentBefore={<Search24Regular style={{ fontSize: "18px", color: "#64748b" }} />}
            placeholder="Search quizzes, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: "220px", flex: 1 }}
          />

          <Select
            value={examFilter}
            onChange={(e, data) => setExamFilter(data.value)}
            style={{ width: "180px" }}
          >
            <option value="">All Exams</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
            <option value="standalone">Standalone Topics</option>
          </Select>

          <Select
            value={difficultyFilter}
            onChange={(e, data) => setDifficultyFilter(data.value)}
            style={{ width: "140px" }}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>

        {/* View Toggle */}
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as "grid" | "tree")}
          style={{ border: "none" }}
        >
          <Tab value="grid" icon={<Grid24Regular />}>Interactive Grid</Tab>
          <Tab value="tree" icon={<TextBulletListTree24Regular />}>Taxonomy Tree</Tab>
        </TabList>
      </div>

      {/* ── Active View Content ── */}

      {activeTab === "grid" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Quizzes Card Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            {paginatedQuizzes.map(quiz => (
              <Card key={quiz.id} className={styles.interactiveCard}>
                {/* Breadcrumbs */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                  {quiz.breadcrumbs.map((crumb, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Text size={100} style={{ color: "#64748b", fontWeight: idx === quiz.breadcrumbs.length - 1 ? "semibold" : "normal" }}>
                        {crumb}
                      </Text>
                      {idx < quiz.breadcrumbs.length - 1 && <span style={{ color: "#cbd5e1", fontSize: "10px" }}>/</span>}
                    </div>
                  ))}
                </div>

                {/* Quiz Title */}
                <Text size={400} weight="bold" style={{ color: "#0f172a", lineHeight: "1.3" }}>
                  {quiz.title}
                </Text>

                {/* Badges & Meta */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
                  <Badge color={getDifficultyColor(quiz.difficulty)} style={{ borderRadius: '6px' }}>
                    {quiz.difficulty}
                  </Badge>
                  <Badge appearance="tint" color="informative" style={{ borderRadius: '6px' }}>
                    {quiz.questionsCount} questions
                  </Badge>
                </div>

                {/* Start Action */}
                <Link 
                  href={`/quiz/${quiz.id}`} 
                  style={{ 
                    textDecoration: "none", 
                    marginTop: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "#0078d4",
                    color: "white",
                    borderRadius: "8px",
                    height: "38px",
                    fontWeight: "600",
                    fontSize: "14px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "background-color 0.2s"
                  }}
                >
                  Start Quiz
                  <ArrowRight16Regular />
                </Link>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {filteredQuizzes.length === 0 && (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              backgroundColor: "white", borderRadius: "16px",
              border: "1px dashed #cbd5e1"
            }}>
              <Sparkle24Regular style={{ fontSize: "40px", color: "#94a3b8", marginBottom: "16px" }} />
              <Text size={500} weight="bold" block style={{ color: "#1e293b", marginBottom: "8px" }}>No Quizzes Found</Text>
              <Text size={200} style={{ color: "#64748b" }}>Adjust your filters or search query to find linked study materials.</Text>
            </div>
          )}

          {/* Sentinel element for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <Spinner label="Loading more quizzes..." />
            </div>
          )}

        </div>
      ) : (
        /* Taxonomy Accordion Tree View */
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {exams.length > 0 && (
            <div>
              <Text size={600} weight="bold" style={{ marginBottom: '20px', display: 'block', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>
                Exams
              </Text>
              <Accordion multiple collapsible>
                {exams.map(exam => (
                  <AccordionItem key={exam.id} value={exam.id} style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "12px", overflow: "hidden" }}>
                    <AccordionHeader size="extra-large">
                      <Text weight="bold" size={400} style={{ color: '#0f172a' }}>{exam.title}</Text>
                    </AccordionHeader>
                    <AccordionPanel style={{ padding: '20px 24px' }}>
                      {exam.description && (
                        <p style={{ margin: "0 0 24px 0", color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{exam.description}</p>
                      )}
                      {exam.topics.length === 0 ? (
                        <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>No topics linked under this exam yet.</Text>
                      ) : (
                        exam.topics.map(topic => renderTopic(topic))
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {standaloneTopics.length > 0 && (
            <div>
              <Text size={600} weight="bold" style={{ marginBottom: '20px', display: 'block', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#0f172a' }}>
                Standalone Topics
              </Text>
              <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
                {standaloneTopics.map(topic => renderTopic(topic))}
              </div>
            </div>
          )}

          {exams.length === 0 && standaloneTopics.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 24px",
              backgroundColor: "white", borderRadius: "16px",
              border: "1px dashed #cbd5e1"
            }}>
              <Text style={{ color: "#64748b" }}>No study topics available. Go to the Admin Panel to generate or create some!</Text>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
