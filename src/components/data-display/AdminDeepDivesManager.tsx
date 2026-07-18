"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Trash2,
  RefreshCw,
  Eye,
  Loader2,
} from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import NoData from "@/components/feedback/NoData";
import { difficultyColor } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/OverlayProvider";
import { Pagination } from "@/components/data-display/Pagination";
import { SearchFilterBar } from "@/components/data-display/SearchFilterBar";

interface QuestionRecord {
  id: string;
  text: string;
  correctAnswer: string;
  elaboration: string | null;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface AdminDeepDivesManagerProps {
  /** All questions with saved elaborations, fetched server-side. */
  questions: QuestionRecord[];
}

/**
 * AdminDeepDivesManager — full management table for saved AI elaborations.
 * Supports per-item regenerate/delete, bulk delete-all, search, and pagination.
 */
export function AdminDeepDivesManager({ questions: initialQuestions }: AdminDeepDivesManagerProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRecord[]>(initialQuestions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const dialog = useDialog();

  const triggerConfirm = (title: string, description: string, onConfirm: () => Promise<void>) =>
    dialog.confirm({ title, description, onConfirm });

  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic.title))).sort();

  const filtered = questions.filter(q => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.quiz?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !topicFilter || q.topic.title === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRegenerate = async (q: QuestionRecord) => {
    setLoadingId(q.id);
    try {
      const res = await fetch("/api/admin/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, force: true })
      });
      const json = await res.json();
      if (json.success) {
        setQuestions(prev => prev.map(item =>
          item.id === q.id ? { ...item, elaboration: json.markdown } : item
        ));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = (q: QuestionRecord) => {
    triggerConfirm(
      "Delete Elaboration",
      `Are you sure you want to delete the saved Deep Dive for "${q.text.slice(0, 60)}…"? It will be regenerated from AI the next time it is requested.`,
      async () => {
        setLoadingId(q.id);
        await fetch("/api/admin/elaborate", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: q.id })
        });
        setQuestions(prev => prev.filter(item => item.id !== q.id));
      }
    );
  };

  const handleBulkDelete = () => {
    triggerConfirm(
      "Delete All Deep Dives",
      `Are you sure you want to permanently delete all ${questions.length} saved elaborations? They will be regenerated fresh on next request.`,
      async () => {
        setLoadingId("bulk");
        await fetch("/api/admin/elaborate/all", { method: "DELETE" });
        setQuestions([]);
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 py-4 w-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center shrink-0 shadow-xs">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Deep Dives</span>
              <Badge variant="secondary" className="px-2 py-0.5 font-bold text-[10px]">
                {questions.length}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage saved AI elaborations</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {questions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loadingId === "bulk"}
              className="text-danger border-danger/20 hover:bg-danger/10 hover:border-danger/40 h-9 font-semibold text-xs gap-1.5"
            >
              {loadingId === "bulk" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>{loadingId === "bulk" ? "Deleting..." : "Delete All"}</span>
            </Button>
          )}

          <LinkButton href="/deep-dives" variant="primary" className="h-9 px-4 font-semibold text-xs gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span>View Public Library</span>
          </LinkButton>
        </div>
      </div>

      {/* Toolbar Search & Filter Box */}
      {questions.length > 0 && (
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
          searchPlaceholder="Search question, topic, quiz..."
          filterValue={topicFilter}
          onFilterChange={v => { setTopicFilter(v); setCurrentPage(1); }}
          filterOptions={uniqueTopics.map(t => ({ value: t, label: t }))}
          filterPlaceholder="All Topics"
        />
      )}

      {/* Main Table or Empty State */}
      {questions.length === 0 ? (
        <NoData 
          title="No Saved Deep Dives" 
          description="Elaborations appear here once users generate them via the 🤖 AI Deep Dive button in quiz results." 
          icon="brain" 
        />
      ) : (
        <Card className="border-border/80 shadow-xs overflow-hidden p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold bg-secondary/10">
                  <th scope="col" className="py-3 px-4 font-bold max-w-md">Question</th>
                  <th scope="col" className="py-3 px-4 font-bold">Topic</th>
                  <th scope="col" className="py-3 px-4 font-bold">Quiz</th>
                  <th scope="col" className="py-3 px-4 font-bold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-foreground/90 font-medium leading-relaxed max-w-md truncate">
                      {item.text}
                    </td>
                    <td className="py-3 px-4 text-foreground/80 font-medium whitespace-nowrap">
                      {item.topic.title === "__internal__" ? "General" : item.topic.title}
                    </td>
                    <td className="py-3 px-4">
                      {item.quiz ? (
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[10px] text-foreground font-bold truncate leading-none">{item.quiz.title}</span>
                          <Badge variant={difficultyColor(item.quiz.difficulty)} className="capitalize text-[8px] font-bold px-1 py-0 w-fit">
                            {item.quiz.difficulty}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium italic">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <LinkButton 
                          href={`/deep-dives/${item.id}`} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </LinkButton>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRegenerate(item)}
                          disabled={!!loadingId}
                          className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-primary rounded-lg"
                        >
                          {loadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                          disabled={loadingId === item.id || loadingId === "bulk"}
                          className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger rounded-lg"
                        >
                          {loadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageSizeChange={v => { setPageSize(v); setCurrentPage(1); }}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}
    </div>
  );
}
export default AdminDeepDivesManager;
