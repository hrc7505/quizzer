"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Text, Badge, Input, Select, Spinner, makeStyles } from "@fluentui/react-components";
import { Search24Regular, ArrowRight16Regular, Sparkle24Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { ShareButton } from "./ShareButton";
import { Share24Regular } from "@fluentui/react-icons";

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

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    backgroundColor: "#ffffff",
    padding: "14px 20px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
    "@media (min-width: 640px)": {
      gap: "20px",
    },
  },
  card: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: "#ffffff",
    transitionProperty: "transform, box-shadow, border-color",
    transitionDuration: "0.2s",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 14px 30px rgba(15, 23, 42, 0.10)",
    },
    "@media (max-width: 480px)": {
      padding: "18px",
      gap: "12px",
    },
  },
  quizNo: {
    color: "#64748b",
    fontWeight: 600,
    display: "block",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontSize: "12px",
  },
  title: {
    color: "#0f172a",
    lineHeight: 1.3,
    display: "block",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "auto",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
    alignItems: "center",
  },
  startBtn: {
    flex: 1,
    height: "40px",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "14px",
    padding: "0 14px",
    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.18)",
    transitionProperty: "background-color",
    transitionDuration: "0.2s",
    ":hover": {
      backgroundColor: "#4338ca",
    },
  },
  shareBtn: {
    height: "40px",
    width: "40px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    padding: "0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    textAlign: "center",
    padding: "64px 24px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
  },
  emptyTitle: {
    color: "#1e293b",
    marginBottom: "6px",
  },
  emptyText: {
    color: "#64748b",
  },
  loadMore: {
    display: "flex",
    justifyContent: "center",
    padding: "16px 0",
  },
});

/**
 * Reusable Card Grid component for Quizzes.
 * Features search filtering, difficulty filtering, and infinite scroll paging.
 */
export function QuizCardGrid({ quizzes, subtopicTitle, basePath }: QuizCardGridProps) {
  const styles = useStyles();
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className={styles.wrap}>
      {/* Filtering Toolbar */}
      <div className={styles.toolbar}>
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
        <div className={styles.grid}>
           {paginated.map((quiz) => (
             <Card key={quiz.id} className={styles.card}>
               <div>
                 <Text size={100} className={styles.quizNo}>
                   Quiz #{quiz.quizOrder}
                 </Text>
                <Text size={400} weight="bold" className={styles.title}>
                  {quiz.title}
                </Text>
              </div>

              <div className={styles.badgeRow}>
                <Badge color={getDifficultyColor(quiz.difficulty)} style={{ borderRadius: '6px' }}>
                  {quiz.difficulty}
                </Badge>
                <Badge appearance="tint" color="informative" style={{ borderRadius: '6px' }}>
                  {quiz._count?.questions || 0} questions
                </Badge>
              </div>

              <div className={styles.actionRow}>
                <Link
                  href={`${basePath}/quiz/${quiz.id}`}
                  className={styles.startBtn}
                >
                  Start Quiz
                  <ArrowRight16Regular />
                </Link>

                {/* Sharing button (mobile-safe: no hover) */}
                <ShareButton
                  icon={<Share24Regular />}
                  buttonAppearance="outline"
                  buttonSize="large"
                  buttonClassName={styles.shareBtn}
                  shareText={`${quiz.title} — Take this quiz on Quizzer!`}
                  defaultUrl={`${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/quiz/${quiz.id}`}
                  resolveUrl={async () => {
                    try {
                      const res = await fetch(`/api/quiz/${quiz.id}/share-url`);
                      if (res.ok) {
                        const json = await res.json();
                        return json?.url ? `${window.location.origin}${json.url}` : undefined;
                      }
                    } catch {
                      return undefined;
                    }
                    return undefined;
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Sparkle24Regular style={{ fontSize: "36px", color: "#94a3b8", marginBottom: "12px" }} />
          <Text size={500} weight="bold" block className={styles.emptyTitle}>
            No quizzes found in &quot;{subtopicTitle}&quot;
          </Text>
          <Text size={200} className={styles.emptyText}>Adjust your filters or query to locate linked quizzes.</Text>
        </div>
      )}

      {/* Infinite Scroll Spinner */}
      {hasMore && (
        <div ref={sentinelRef} className={styles.loadMore}>
          <Spinner label="Loading more quizzes..." />
        </div>
      )}
    </div>
  );
}
