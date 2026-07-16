"use client";

import { useState } from "react";
import { Text, Input, Card, Badge, Button } from "@fluentui/react-components";
import { BookOpenRegular, Brain20Regular, Filter20Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { difficultyColor } from "@/lib/format";
import { useDeepDivesLibraryStyles } from "./styles/useDeepDivesLibraryStyles";
import NoData from "@/components/feedback/NoData";

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
  const styles = useDeepDivesLibraryStyles();
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

  return (
    <div className={styles.root}>
      <div className={styles.headerWrap}>
        <div className={styles.headerRow}>
          <div className={styles.headerIconContainer}>
            <Brain20Regular className={styles.headerIcon} />
          </div>
          <div>
            <Text size={800} weight="bold" className={styles.headerTitle}>AI Deep Dives</Text>
            <Text size={300} className={styles.headerSubtitle}>
              {questions.length} elaboration{questions.length !== 1 ? "s" : ""} saved · Browse and revisit any time
            </Text>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Filter20Regular className={styles.searchIcon} />
        <Input
          placeholder="Search by question, topic, or quiz…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className={styles.searchInput}
        />
        {search && (
          <Button size="small" appearance="subtle" onClick={() => setSearch("")}>Clear</Button>
        )}
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <NoData title="No Deep Dives Yet" description="Complete a quiz and click the 🤖 AI Deep Dive button on any question to generate and save your first elaboration." icon="brain" />
      )}

      {/* No search results */}
      {questions.length > 0 && filtered.length === 0 && (
        <NoData title="No results match your search." description="Try adjusting your search terms or filters." icon="sparkle" />
      )}

      {/* Grouped cards */}
      {Object.entries(grouped).map(([topicTitle, qs]) => (
        <div key={topicTitle} className={styles.groupWrap}>
          <div className={styles.groupHeader}>
            <BookOpenRegular className={styles.headerIcon} />
            <Text size={500} weight="semibold" className={styles.groupTitle}>{topicTitle}</Text>
            <Badge appearance="filled" color="informative" className={styles.groupBadge}>
              {qs.length}
            </Badge>
          </div>

          <div className={styles.cardGrid}>
            {qs.map(q => (
              <Link key={q.id} href={`/deep-dives/${q.id}`} className={styles.cardLink}>
                <Card className={styles.card}>
                  {/* Quiz badge */}
                  {q.quiz && (
                    <div className={styles.cardBadgeRow}>
                      <Badge appearance="tint" color="informative" className={styles.cardBadge}>
                        {q.quiz.title}
                      </Badge>
                      <Badge appearance="filled" color={difficultyColor(q.quiz.difficulty)} className={styles.cardBadge}>
                        {q.quiz.difficulty}
                      </Badge>
                    </div>
                  )}

                  {/* Question text */}
                  <Text size={300} weight="semibold" className={styles.questionText}>
                    {q.text}
                  </Text>

                  {/* Correct answer */}
                  <div className={styles.correctAnswerBlock}>
                    <Text size={100} className={styles.correctAnswerText}>✓ {q.correctAnswer}</Text>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            Previous
          </Button>
          <Text size={200} className={styles.paginationText}>
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
