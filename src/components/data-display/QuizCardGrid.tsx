"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ArrowRight, Share2 } from "lucide-react";

import { ShareButton } from "@/components/ui/ShareButton";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

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

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevDifficultyFilter, setPrevDifficultyFilter] = useState(difficultyFilter);

  if (searchQuery !== prevSearchQuery || difficultyFilter !== prevDifficultyFilter) {
    setVisibleCount(12);
    setPrevSearchQuery(searchQuery);
    setPrevDifficultyFilter(difficultyFilter);
  }

  // Filter quizzes
  const filtered = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !difficultyFilter || quiz.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const paginated = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

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

  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "default";
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filtering Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-card border border-border/80 p-4 rounded-xl shadow-xs transition-colors duration-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Search quizzes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="h-10"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>
      </div>

      {/* Grid of Quizzes */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((quiz) => (
            <Card key={quiz.id} className="p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card border-border/80">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Quiz #{quiz.quizOrder}
                </span>
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                  {quiz.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-4 select-none">
                <Badge variant={difficultyBadgeVariant(quiz.difficulty)} className="capitalize font-bold text-[10px] px-2 py-0.5">
                  {quiz.difficulty}
                </Badge>
                <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                  {quiz._count?.questions || 0} questions
                </Badge>
              </div>

              <div className="flex items-center gap-2.5 mt-5 pt-3.5 border-t border-border/30">
                <Link
                  href={`${basePath}/quiz/${quiz.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all no-underline duration-150 cursor-pointer"
                >
                  <span>Start Quiz</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <ShareButton
                  icon={<Share2 className="h-4 w-4" />}
                  buttonAppearance="outline"
                  buttonSize="icon"
                  buttonClassName="h-10 w-10 shrink-0 border border-border/80 bg-surface rounded-lg"
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
        <NoData 
          title={`No quizzes found in "${subtopicTitle}"`} 
          description="Adjust your filters or query to locate linked quizzes." 
          icon="sparkle" 
        />
      )}

      {/* Infinite Scroll Spinner */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6 select-none">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80">
            <Spinner size="sm" />
            <span>Loading more quizzes...</span>
          </div>
        </div>
      )}
    </div>
  );
}
