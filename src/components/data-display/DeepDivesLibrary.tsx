"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, BookOpen, Search, X } from "lucide-react";

import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuestionSummary {
  id: string;
  text: string;
  correctAnswer: string;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface DeepDivesLibraryProps {
  /** List of questions with saved elaborations, from DB. */
  questions: QuestionSummary[];
}

export function DeepDivesLibrary({ questions }: DeepDivesLibraryProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filtered = questions.filter(q =>
    q.text.toLowerCase().includes(search.toLowerCase()) ||
    q.topic.title.toLowerCase().includes(search.toLowerCase()) ||
    q.quiz?.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Group paginated items by topic title
  const grouped: Record<string, QuestionSummary[]> = {};
  paginated.forEach(q => {
    const key = q.topic.title === "__internal__" ? "General" : q.topic.title;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });

  const difficultyBadgeVariant = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff === "easy") return "success";
    if (diff === "medium") return "warning";
    if (diff === "hard") return "danger";
    return "default";
  };

  return (
    <div className="flex flex-col gap-6 w-full py-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10 shadow-xs">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Deep Dives</h1>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              {questions.length} elaboration{questions.length !== 1 ? "s" : ""} saved · Browse and study cached AI library
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-2 relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Search by question, topic, or quiz…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="pl-9 pr-14 h-10 w-full"
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground/75 hover:text-foreground cursor-pointer rounded-full hover:bg-secondary active:scale-95 duration-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Empty states */}
      {questions.length === 0 && (
        <NoData 
          title="No Deep Dives Yet" 
          description="Complete a quiz and click the 🤖 AI Deep Dive button on any question to generate and save your first elaboration." 
          icon="brain" 
        />
      )}

      {questions.length > 0 && filtered.length === 0 && (
        <NoData 
          title="No results match your search." 
          description="Try adjusting your search terms or filters." 
          icon="sparkle" 
        />
      )}

      {/* Grouped cards */}
      {Object.entries(grouped).map(([topicTitle, qs]) => (
        <div key={topicTitle} className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-base font-bold text-foreground tracking-tight">{topicTitle}</h2>
            <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
              {qs.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qs.map(q => (
              <Link key={q.id} href={`/deep-dives/${q.id}`} className="group no-underline flex">
                <Card className="p-5 flex flex-col justify-between w-full hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col gap-3">
                    {/* Quiz badges */}
                    {q.quiz && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="default" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                          {q.quiz.title}
                        </Badge>
                        <Badge variant={difficultyBadgeVariant(q.quiz.difficulty)} className="capitalize text-[10px] font-bold">
                          {q.quiz.difficulty}
                        </Badge>
                      </div>
                    )}

                    {/* Question text */}
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                      {q.text}
                    </h3>
                  </div>

                  {/* Correct answer preview */}
                  <div className="mt-4 pt-3.5 border-t border-border/30 bg-success/5 text-success rounded-lg px-3 py-2 text-xs font-medium">
                    ✓ {q.correctAnswer}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border/40 select-none">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="h-8 font-semibold text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {currentPage} of {totalPages} · {filtered.length} results
          </span>
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
      )}
    </div>
  );
}
