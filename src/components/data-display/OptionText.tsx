"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { ArrowRight } from "lucide-react";

import { autoFormatCodeAndMath } from "@/lib/format";
import { cn } from "@/utils/cn";

interface OptionTextProps {
  text: string;
  className?: string;
}

/**
 * Checks if a string is a pair-matching option (e.g. "a-3, b-1, c-2, d-4" or "A-3, B-1, C-2, D-4" or "(a)-(3), (b)-(1)...")
 */
function parseMatchingPairs(text: string): Array<{ left: string; right: string }> | null {
  if (!text) return null;
  const trimmed = text.trim();

  // Pattern: pairs separated by comma or semicolon, e.g. "a-3, b-1, c-2, d-4" or "(a)-(3), (b)-(1)" or "A->3, B->1"
  const parts = trimmed.split(/[,;\s]+(?=[a-dA-D1-9]\s*[-–—→>])/).map((p) => p.trim()).filter(Boolean);

  if (parts.length < 2) {
    // Try standard comma-separated split
    const commaParts = trimmed.split(/\s*,\s*/);
    if (commaParts.length >= 2 && commaParts.every((p) => /^[(\[]?[a-dA-D1-9][)\]]?\s*[-–—→>:\=]\s*[(\[]?[a-dA-D1-9ivxIVX]+[)\]]?$/.test(p.trim()))) {
      return commaParts.map((p) => {
        const match = p.match(/^([(\[]?[a-dA-D1-9][)\]]?)\s*[-–—→>:\=]\s*([(\[]?[a-dA-D1-9ivxIVX]+[)\]]?)$/);
        return {
          left: match ? match[1].replace(/[()[\]]/g, "").trim() : p,
          right: match ? match[2].replace(/[()[\]]/g, "").trim() : "",
        };
      });
    }
    return null;
  }

  const pairs: Array<{ left: string; right: string }> = [];
  for (const part of parts) {
    const match = part.match(/^([(\[]?[a-dA-D1-9][)\]]?)\s*[-–—→>:\=]\s*([(\[]?[a-dA-D1-9ivxIVX]+[)\]]?)$/);
    if (match) {
      pairs.push({
        left: match[1].replace(/[()[\]]/g, "").trim(),
        right: match[2].replace(/[()[\]]/g, "").trim(),
      });
    } else {
      return null;
    }
  }

  return pairs.length >= 2 ? pairs : null;
}

/**
 * Renders quiz option text with automatic support for:
 * 1. Pair-matching chips (e.g. [ a → 3 ] [ b → 1 ])
 * 2. Inline KaTeX math equations (e.g. $O(n^2)$)
 * 3. Standard text with inline code
 */
export function OptionText({ text, className }: OptionTextProps) {
  const matchingPairs = React.useMemo(() => parseMatchingPairs(text), [text]);
  const formattedMath = React.useMemo(() => autoFormatCodeAndMath(text), [text]);

  if (matchingPairs) {
    return (
      <div className={cn("inline-flex flex-wrap items-center gap-1.5 sm:gap-2", className)}>
        {matchingPairs.map((pair, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/80 dark:bg-zinc-800/80 border border-border/70 text-xs font-mono font-semibold shadow-2xs"
          >
            <span className="text-primary font-bold">{pair.left}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground stroke-[2.5]" />
            <span className="text-indigo-400 font-bold">{pair.right}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <span className={cn("inline-block leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="inline leading-relaxed">{children}</span>,
          code: ({ children }) => (
            <code className="bg-secondary/70 text-foreground px-1 py-0.5 rounded text-[11px] font-mono border border-border/50">
              {children}
            </code>
          ),
        }}
      >
        {formattedMath}
      </ReactMarkdown>
    </span>
  );
}

export default OptionText;
