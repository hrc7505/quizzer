"use client";

import { useState } from "react";
import { Card, Input, Text, Button } from "@fluentui/react-components";
import { Search24Regular, ArrowRight16Regular, Sparkle24Regular } from "@fluentui/react-icons";
import Link from "next/link";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Search Input Bar */}
      <div style={{
        backgroundColor: "white", padding: "14px 20px", borderRadius: "12px",
        border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}>
        <Input
          contentBefore={<Search24Regular style={{ fontSize: "18px", color: "#64748b" }} />}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", maxWidth: "360px" }}
        />
      </div>

      {/* Grid of Cards */}
      {filtered.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px"
        }}>
          {filtered.map(item => (
            <Link key={item.id} href={item.href} style={{ textDecoration: "none" }}>
              <Card style={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                padding: "24px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out"
              }}>
                <div>
                  <Text size={400} weight="bold" style={{ color: "#0f172a", display: "block", marginBottom: "6px" }}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text size={200} style={{ color: "#64748b", lineHeight: "1.4", display: "block" }}>
                      {item.description.length > 120 ? `${item.description.slice(0, 120)}...` : item.description}
                    </Text>
                  )}
                </div>

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
                  {item.meta ? (
                    <span style={{
                      fontSize: "11px", color: "#4f46e5", fontWeight: "semibold",
                      backgroundColor: "#e0e7ff", padding: "4px 8px", borderRadius: "6px"
                    }}>
                      {item.meta}
                    </span>
                  ) : <span />}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0078d4", fontSize: "13px", fontWeight: "bold" }}>
                    Open <ArrowRight16Regular />
                  </div>
                </div>
              </Card>
            </Link>
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
            {emptyMessage}
          </Text>
          <Text size={200} style={{ color: "#64748b" }}>Try adjusting your search terms or verify your configuration.</Text>
        </div>
      )}
    </div>
  );
}
