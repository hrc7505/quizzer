"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import NoData from "@/components/feedback/NoData";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
    <div className="flex flex-col gap-6 w-full">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 w-full"
        />
      </div>

      {/* Grid of Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <Link key={item.id} href={item.href} className="group no-underline flex">
              <Card className="flex flex-col justify-between p-5 w-full hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/30 text-xs">
                  {item.meta ? (
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                      {item.meta}
                    </span>
                  ) : <span />}
                  
                  <div className="flex items-center gap-1 font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
