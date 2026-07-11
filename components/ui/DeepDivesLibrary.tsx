"use client";

import { useState } from "react";
import { Text, Input, Card, Badge, Button } from "@fluentui/react-components";
import { BookOpenRegular, Brain20Regular, Filter20Regular } from "@fluentui/react-icons";
import Link from "next/link";

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

/**
 * DeepDivesLibrary — public browsable grid of all saved AI elaborations.
 * Groups by topic, supports search filter, paginates results.
 */
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
    const key = q.topic.title;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });

  const difficultyColor = (d: string): "success" | "warning" | "danger" =>
    d === "Easy" ? "success" : d === "Hard" ? "danger" : "warning";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Brain20Regular style={{ color: "white", fontSize: "24px" }} />
          </div>
          <div>
            <Text size={800} weight="bold" style={{ color: "#1a1a2e", display: "block" }}>AI Deep Dives</Text>
            <Text size={300} style={{ color: "#6b7280" }}>
              {questions.length} elaboration{questions.length !== 1 ? "s" : ""} saved · Browse and revisit any time
            </Text>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: "white", borderRadius: "12px",
        padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
      }}>
        <Filter20Regular style={{ color: "#9ca3af" }} />
        <Input
          placeholder="Search by question, topic, or quiz…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          style={{ flex: 1, border: "none", outline: "none" }}
        />
        {search && (
          <Button size="small" appearance="subtle" onClick={() => setSearch("")}>Clear</Button>
        )}
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 32px",
          background: "white", borderRadius: "16px",
          border: "1px dashed #d1d5db"
        }}>
          <Brain20Regular style={{ fontSize: "48px", color: "#9ca3af", marginBottom: "16px" }} />
          <Text size={500} weight="semibold" block style={{ color: "#374151", marginBottom: "8px" }}>
            No Deep Dives Yet
          </Text>
          <Text size={300} style={{ color: "#6b7280" }}>
            Complete a quiz and click "🤖 AI Deep Dive" on any question to generate and save your first elaboration.
          </Text>
        </div>
      )}

      {/* No search results */}
      {questions.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px", background: "white", borderRadius: "12px" }}>
          <Text size={400} style={{ color: "#6b7280" }}>No results match your search.</Text>
        </div>
      )}

      {/* Grouped cards */}
      {Object.entries(grouped).map(([topicTitle, qs]) => (
        <div key={topicTitle} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpenRegular style={{ color: "#667eea" }} />
            <Text size={500} weight="semibold" style={{ color: "#1f2937" }}>{topicTitle}</Text>
            <Badge appearance="filled" color="informative" style={{ borderRadius: "12px" }}>
              {qs.length}
            </Badge>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px"
          }}>
            {qs.map(q => (
              <Link key={q.id} href={`/deep-dives/${q.id}`} style={{ textDecoration: "none" }}>
                <Card style={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {/* Quiz badge */}
                  {q.quiz && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <Badge appearance="tint" color="informative" style={{ borderRadius: "6px", fontSize: "11px" }}>
                        {q.quiz.title}
                      </Badge>
                      <Badge appearance="filled" color={difficultyColor(q.quiz.difficulty)} style={{ borderRadius: "6px", fontSize: "11px" }}>
                        {q.quiz.difficulty}
                      </Badge>
                    </div>
                  )}

                  {/* Question text */}
                  <Text size={300} weight="semibold" style={{
                    color: "#1f2937",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: "1.5"
                  }}>
                    {q.text}
                  </Text>

                  {/* Correct answer */}
                  <div style={{
                    marginTop: "auto",
                    padding: "8px 12px",
                    background: "#f0fdf4",
                    borderRadius: "6px",
                    borderLeft: "3px solid #22c55e"
                  }}>
                    <Text size={100} style={{ color: "#15803d" }}>✓ {q.correctAnswer}</Text>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", paddingTop: "8px" }}>
          <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            Previous
          </Button>
          <Text size={200} style={{ color: "#6b7280" }}>
            Page {currentPage} of {totalPages} · {filtered.length} results
          </Text>
          <Button size="small" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

    </div>
  );
}
