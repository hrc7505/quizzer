"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Text, Button, Badge, Input, Select, Spinner } from "@fluentui/react-components";
import { Search24Regular, ArrowRight16Regular, Sparkle24Regular } from "@fluentui/react-icons";
import Link from "next/link";

interface QuizItem {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  _count?: { questions: number };
}

interface QuizCardGridProps {
  /** Array of quizzes to render. */
  quizzes: QuizItem[];
  /** Subtopic title or page section title. */
  subtopicTitle: string;
  /** Base URL path for the current subtopic (e.g. /exams/examId/topicId/subtopicId). */
  basePath: string;
}

/**
 * Reusable Card Grid component for Quizzes.
 * Features search filtering, difficulty filtering, and infinite scroll paging.
 */
export function QuizCardGrid({ quizzes, subtopicTitle, basePath }: QuizCardGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filter quizzes
  const filtered = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !difficultyFilter || quiz.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const paginated = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Reset pagination count on search or filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, difficultyFilter]);

  // Infinite scroll intersection observer
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

  const getDifficultyColor = (diff: string): "success" | "warning" | "danger" => {
    if (diff === "Easy") return "success";
    if (diff === "Hard") return "danger";
    return "warning";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Filtering Toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "12px", backgroundColor: "white",
        padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}>
        <Input
          contentBefore={<Search24Regular style={{ fontSize: "18px", color: "#64748b" }} />}
          placeholder="Search quizzes by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ minWidth: "220px", flex: 1 }}
        />

        <Select
          value={difficultyFilter}
          onChange={(e, data) => setDifficultyFilter(data.value)}
          style={{ width: "160px" }}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>
      </div>

      {/* Grid of Quizzes */}
      {paginated.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px"
        }}>
          {paginated.map(quiz => (
            <Card key={quiz.id} style={{
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <div>
                <Text size={100} style={{ color: "#64748b", fontWeight: "semibold", display: "block", marginBottom: "4px" }}>
                  Quiz #{quiz.quizOrder}
                </Text>
                <Text size={400} weight="bold" style={{ color: "#0f172a", lineHeight: "1.3", display: "block" }}>
                  {quiz.title}
                </Text>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
                <Badge color={getDifficultyColor(quiz.difficulty)} style={{ borderRadius: '6px' }}>
                  {quiz.difficulty}
                </Badge>
                <Badge appearance="tint" color="informative" style={{ borderRadius: '6px' }}>
                  {quiz._count?.questions || 0} questions
                </Badge>
              </div>

              <Link 
                href={`${basePath}/quiz/${quiz.id}`} 
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
      ) : (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          backgroundColor: "white", borderRadius: "16px",
          border: "1px dashed #cbd5e1"
        }}>
          <Sparkle24Regular style={{ fontSize: "36px", color: "#94a3b8", marginBottom: "12px" }} />
          <Text size={500} weight="bold" block style={{ color: "#1e293b", marginBottom: "6px" }}>
            No quizzes found in "{subtopicTitle}"
          </Text>
          <Text size={200} style={{ color: "#64748b" }}>Adjust your filters or query to locate linked quizzes.</Text>
        </div>
      )}

      {/* Infinite Scroll Spinner */}
      {hasMore && (
        <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <Spinner label="Loading more quizzes..." />
        </div>
      )}
    </div>
  );
}
