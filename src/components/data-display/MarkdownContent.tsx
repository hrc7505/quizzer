"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/utils/cn";

export interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Normalizes common LaTeX syntax, strips stray formatting artifacts (like stray "<" or dangling tags),
 * and separates block equations so KaTeX renders them with clean clearance and no overlapping.
 */
function normalizeMathMarkdown(text: string): string {
  if (!text) return "";

  let processed = text;

  // 1. Clean stray characters like standalone '<' or '>' lines or trailing artifacts (e.g. "V<" or "16 <")
  processed = processed.replace(/^\s*[<>]\s*$/gm, "");
  processed = processed.replace(/([A-Za-z0-9}\]])\s*[<>](?=\s*(\n|$))/g, "$1");
  processed = processed.replace(/[<>](?=\s*$)/g, "");

  // 2. Replace LaTeX bracket blocks \[ ... \] with $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, "\n\n$$$$$1$$$$\n\n");

  // 3. Replace LaTeX inline blocks \( ... \) with $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");

  // 4. Ensure block math $$ ... $$ has newlines before and after to render as dedicated display math
  processed = processed.replace(/([^\n])\$\$(.*?)\$\$/g, "$1\n\n$$$$$2$$$$\n\n");
  processed = processed.replace(/\$\$(.*?)\$\$([^\n])/g, "\n\n$$$$$1$$$$\n\n$2");

  // 5. Clean up any consecutive blank lines
  processed = processed.replace(/\n{3,}/g, "\n\n");

  return processed.trim();
}

/**
 * Renders rich markdown with KaTeX mathematical formulas, LaTeX equations ($...$ and $$...$$),
 * tables, lists, and formatted code blocks with dark mode support.
 */
export const MarkdownContent = React.memo(function MarkdownContent({
  content,
  className,
}: MarkdownContentProps) {
  if (!content) return null;

  const normalized = React.useMemo(() => normalizeMathMarkdown(content), [content]);

  return (
    <div
      className={cn(
        "markdown-content text-xs sm:text-sm text-foreground/90 break-words font-normal leading-relaxed select-text",
        // Paragraph & List spacing + generous line height to prevent fraction collisions
        "[&_p]:leading-loose [&_p]:my-2.5",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:my-3",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:my-3",
        "[&_li]:leading-loose [&_li]:my-1.5",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        // KaTeX display math formatting
        "[&_.katex-display]:my-4 [&_.katex-display]:p-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:rounded-xl [&_.katex-display]:bg-secondary/40 [&_.katex-display]:border [&_.katex-display]:border-border/40 [&_.katex-display]:text-center",
        "[&_.katex-html]:overflow-x-auto [&_.katex-html]:overflow-y-hidden",
        // Code blocks
        "[&_code]:bg-secondary/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[11px] [&_code]:font-mono",
        "[&_pre]:bg-secondary/80 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border/60",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
});
