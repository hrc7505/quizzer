"use client";

import { useState } from "react";
import { Card, Input, Text } from "@fluentui/react-components";
import { Search24Regular, ArrowRight16Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { useDirectoryCardListStyles } from "./styles/useDirectoryCardListStyles";
import NoData from "@/components/feedback/NoData";

interface DirectoryItem {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  meta?: string;
}

interface DirectoryCardListProps {
  /** Array of items (Exams, Topics, or Subtopics) to render. */
  items: DirectoryItem[];
  /** Optional placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Label describing the type of items (e.g. "Exams", "Topics"). */
  itemLabel: string;
  /** Optional empty state message. */
  emptyMessage?: string;
}

/**
 * Reusable Card Grid component for directory levels (Exams, Main Topics, Subtopics).
 * Renders a searchable grid of hover-animated cards.
 */
export function DirectoryCardList({
  items,
  searchPlaceholder = "Search...",
  itemLabel,
  emptyMessage = `No ${itemLabel} found.`
}: DirectoryCardListProps) {
  const [query, setQuery] = useState("");

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
  );

  const styles = useDirectoryCardListStyles();

  return (
    <div className={styles.container}>
      {/* Search Input Bar */}
      <div className={styles.searchBar}>
<Input
          contentBefore={<Search24Regular className={styles.searchIcon} />}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Grid of Cards */}
      {filtered.length > 0 ? (
<div className={styles.grid}>
          {filtered.map(item => (
<Link key={item.id} href={item.href} className={styles.link}>
<Card className={styles.card}>
                <div>
<Text size={400} weight="bold" className={styles.title}>
                    {item.title}
                  </Text>
                  {item.description && (
<Text size={200} className={styles.description}>
                      {item.description.length > 120 ? `${item.description.slice(0, 120)}...` : item.description}
                    </Text>
                  )}
                </div>

<div className={styles.metaRow}>
                  {item.meta ? (
                    <span className={styles.metaBadge}>
                      {item.meta}
                    </span>
                  ) : <span />}
<div className={styles.openRow}>
                    Open <ArrowRight16Regular />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <NoData title={emptyMessage} description="Try adjusting your search terms or verify your configuration." icon="sparkle" />
      )}
    </div>
  );
}
