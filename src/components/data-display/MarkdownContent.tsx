"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Check, Sparkles, Lightbulb, BookOpen, Layers } from "lucide-react";
import { cn } from "@/utils/cn";

export interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Normalizes LaTeX expressions to use display fractions (\dfrac) and groups all
 * intermediate formulas cleanly inside their parent step card.
 */
function normalizeMathMarkdown(text: string): string {
  if (!text) return "";

  let processed = text;

  // Clean trailing stray '<' or '>' characters
  processed = processed.replace(/^\s*[<>]\s*$/gm, "");
  processed = processed.replace(/([A-Za-z0-9}\]])\s*[<>](?=\s*(\n|$))/g, "$1");
  processed = processed.replace(/[<>](?=\s*$)/g, "");

  // Convert \frac to \dfrac so all fractions have full display clearance and proper baselines
  processed = processed.replace(/\\frac(?=[{\s])/g, "\\dfrac");

  // 1. Replace bracket blocks \[ ... \] with $$ ... $$
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, "\n$$\n$1\n$$\n");

  // 2. Replace inline blocks \( ... \) with $ ... $
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");

  // 3. Group child lines under list item headers so equations stay inside the step card
  const lines = processed.split("\n");
  const groupedLines: string[] = [];
  let inListItem = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect bullet or numbered step headers: e.g. "- **Step", "1. **Step", "- **Concept", "* Step"
    const isNewStep = /^(\s*[-*]|\s*\d+\.)\s+(\*\*|Step|Concept|Conclusion|Overview|Takeaway|Note|Tip)/i.test(line) ||
                      /^[-*]\s+/.test(line);

    if (isNewStep) {
      inListItem = true;
      groupedLines.push(line);
    } else if (inListItem && trimmed.length > 0) {
      // Indent subsequent child lines (equations, text, derivations) by 2 spaces to keep them inside the list item
      if (line.startsWith("  ")) {
        groupedLines.push(line);
      } else {
        groupedLines.push("  " + line);
      }
    } else {
      if (trimmed.length === 0) {
        // Keep blank lines inside list item if next line is continuation
        const nextLine = lines[i + 1]?.trim() || "";
        const nextIsNewStep = /^(\s*[-*]|\s*\d+\.)\s+(\*\*|Step|Concept|Conclusion)/i.test(nextLine);
        if (inListItem && !nextIsNewStep && nextLine.length > 0) {
          groupedLines.push("  ");
        } else {
          inListItem = false;
          groupedLines.push("");
        }
      } else {
        groupedLines.push(line);
      }
    }
  }

  return groupedLines.join("\n").trim();
}

/**
 * Step Card item component with adaptive iconography and badge styling.
 */
function StepCardItem({ children }: { children: React.ReactNode }) {
  // Check children text content to determine step type (Concept, Step, Conclusion)
  let isConclusion = false;
  let isConcept = false;

  React.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      if (/conclusion/i.test(child)) isConclusion = true;
      if (/concept|overview/i.test(child)) isConcept = true;
    } else if (React.isValidElement(child) && child.props) {
      const childProps = child.props as { children?: unknown };
      const text = typeof childProps.children === "string" ? childProps.children : "";
      if (/conclusion/i.test(text)) isConclusion = true;
      if (/concept|overview/i.test(text)) isConcept = true;
    }
  });

  return (
    <li
      className={cn(
        "flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border text-foreground/90 text-xs sm:text-sm leading-relaxed shadow-xs transition-all",
        isConclusion
          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30"
          : isConcept
          ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20"
          : "bg-card border-border/80 hover:border-border"
      )}
    >
      <div
        className={cn(
          "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-2xs",
          isConclusion
            ? "bg-emerald-500 text-white"
            : isConcept
            ? "bg-indigo-500 text-white"
            : "bg-primary/10 text-primary"
        )}
      >
        {isConclusion ? (
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        ) : isConcept ? (
          <BookOpen className="h-3.5 w-3.5" />
        ) : (
          <Layers className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2 [&_p]:my-1.5 [&_p]:leading-relaxed">
        {children}
      </div>
    </li>
  );
}

/**
 * Renders rich markdown with point-by-point step cards, KaTeX formulas,
 * syntax-formatted code snippets, and dark mode styling.
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
        "markdown-content text-xs sm:text-sm text-foreground/90 break-words font-normal leading-relaxed select-text space-y-3",
        // KaTeX display block formatting
        "[&_.katex-display]:my-3.5 [&_.katex-display]:p-3.5 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:rounded-xl [&_.katex-display]:bg-secondary/40 [&_.katex-display]:border [&_.katex-display]:border-border/50 [&_.katex-display]:text-center [&_.katex-display]:shadow-2xs",
        "[&_.katex-html]:overflow-x-auto [&_.katex-html]:overflow-y-hidden",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ul: ({ children }) => (
            <ul className="flex flex-col gap-3.5 my-2 list-none p-0 m-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="flex flex-col gap-3.5 my-2 list-none p-0 m-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <StepCardItem>{children}</StepCardItem>,
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-foreground/90">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = match || (typeof children === "string" && children.includes("\n"));

            if (isBlock) {
              return (
                <pre className="p-3.5 rounded-xl bg-secondary/80 border border-border/60 overflow-x-auto text-[11.5px] font-mono leading-relaxed my-2.5 text-foreground shadow-2xs">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }

            return (
              <code
                className="bg-secondary/80 text-foreground px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-border/50"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
});
