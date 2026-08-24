"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { ArrowLeftRight } from "lucide-react";

import { CodeBlock } from "@/components/data-display/CodeBlock";
import { autoFormatCodeAndMath } from "@/lib/format";
import { cn } from "@/utils/cn";

import type {
  FormattedStatement,
  MatchingColumn,
  ParsedQuestionData,
  QuestionTextProps,
} from "@/components/data-display/interfaces/QuestionText.interface";

/**
 * Normalizes bullet list symbols (•, ⁃, ▪, ‣) into clean markdown list items (* ).
 */
function normalizeBulletLists(text: string): string {
  if (!text) return "";
  let res = text.replace(/(?:^|\n)\s*[•⁃▪‣]\s*/g, "\n* ");
  res = res.replace(/(?<=[.?!:।;:]|\b)\s+[•⁃▪‣]\s+/g, "\n* ");
  return res.trim();
}

/**
 * Extracts statement label (e.g. "1.", "(i)", "Assertion (A)") and content from raw line.
 */
function extractStatementParts(statementStr: string): FormattedStatement {
  const match = statementStr.match(
    /^((?:Assertion(?:\s*\([A-Za-z0-9]+\))?|Reason(?:\s*\([A-Za-z0-9]+\))?|કથન(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|કારણ(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|વિધાન\s*\d+|Statement\s*\d+|[1-9]\d?[\.\)]|\([1-9]\d?\)|\([iIvVxX]+\)|[iIvVxX]+[\.\)]|\([a-dA-D]\)|[A-D][\.\)]))[\:\s]+(.*)$/i
  );

  if (match) {
    return {
      label: match[1].trim(),
      content: match[2].trim(),
      raw: statementStr.trim(),
    };
  }

  return {
    label: "",
    content: statementStr.trim(),
    raw: statementStr.trim(),
  };
}

/**
 * Checks label category:
 * - 'alpha': (a), (b), A., B.
 * - 'numeric': (1), (2), 1., 2.
 * - 'roman': (i), (ii), i., ii.
 */
function getLabelType(label: string): "alpha" | "numeric" | "roman" | "other" {
  const clean = label.replace(/[()[\]:.\s]/g, "");
  if (/^[a-zA-Z]$/.test(clean)) return "alpha";
  if (/^\d+$/.test(clean)) return "numeric";
  if (/^[ivxIVX]+$/.test(clean)) return "roman";
  return "other";
}

/**
 * Partitions statements into two matching columns (List I & List II)
 * strictly for genuine 'Match the following' questions.
 */
function extractMatchingColumns(
  premise: string,
  statements: FormattedStatement[]
): { left: MatchingColumn; right: MatchingColumn } | null {
  if (statements.length < 4 || statements.length % 2 !== 0) return null;

  const types = statements.map((s) => getLabelType(s.label));

  // If all statements share the same label type (e.g. all (1), (2), (3), (4)),
  // it is NEVER a matching question (it's a standard multi-statement question).
  const allSameType = types.every((t) => t === types[0]);
  if (allSameType) {
    return null;
  }

  // Case 1: Alternating pattern (e.g. (a), (1), (b), (2), (c), (3), (d), (4))
  const isAlternating =
    types.length >= 4 &&
    types[0] !== types[1] &&
    types.every((t, idx) => {
      if (idx % 2 === 0) return t === types[0];
      return t === types[1];
    });

  if (isAlternating) {
    const leftItems: FormattedStatement[] = [];
    const rightItems: FormattedStatement[] = [];

    statements.forEach((stmt, idx) => {
      if (idx % 2 === 0) {
        leftItems.push(stmt);
      } else {
        rightItems.push(stmt);
      }
    });

    return {
      left: { title: "List I", items: leftItems },
      right: { title: "List II", items: rightItems },
    };
  }

  // Case 2: Grouped pattern (e.g. 4 alpha labels followed by 4 numeric/roman labels)
  const half = Math.floor(statements.length / 2);
  const firstHalfType = types[0];
  const secondHalfType = types[half];

  const isGrouped =
    firstHalfType !== secondHalfType &&
    types.slice(0, half).every((t) => t === firstHalfType) &&
    types.slice(half).every((t) => t === secondHalfType);

  if (isGrouped) {
    return {
      left: { title: "List I", items: statements.slice(0, half) },
      right: { title: "List II", items: statements.slice(half) },
    };
  }

  return null;
}

/**
 * Parses raw question text into premise, sub-statements list, matching columns, and conclusion prompt.
 */
export function parseQuestionText(rawText: string): ParsedQuestionData {
  if (!rawText) {
    return {
      premise: "",
      statements: [],
      prompt: "",
      isMultiStatement: false,
      isMatching: false,
    };
  }

  // 1. Normalize line endings and trim
  let text = rawText.replace(/\r\n/g, "\n").trim();

  // 2. Strip redundant leading question index (e.g. "1. ", "45) ", "Q.1: ")
  text = text.replace(/^(?:Q(?:uestion)?[\.\:\s]*)?\d+[\.\)\:\-\]]\s+/i, "").trim();

  // 3. If code block is present, avoid splitting inside code block
  if (/```[\s\S]*?```/.test(text) || /(?:#\s*include|int\s+main|def\s+\w+|public\s+class)/i.test(text)) {
    return {
      premise: autoFormatCodeAndMath(normalizeBulletLists(text)),
      statements: [],
      prompt: "",
      isMultiStatement: false,
      isMatching: false,
    };
  }

  // 4. Split by existing newlines if present
  let lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 5. If single line or statements were joined into a run-on string, split inline statements
  if (lines.length === 1) {
    const single = lines[0];
    const splitRegex =
      /(?:(?<=[.?!:।;]\s+)|(?<=\:\s*)|(?<=\b(?:નીચેના|સાચું|ખોટું|વિધાનો|વિધાન|જોડકાં|statements|statement|following|correct|incorrect|below|consider)[\s\:\.\,]+))(?=(?:(?:વિધાન\s*\d+|Statement\s*\d+|Assertion(?:\s*\([A-Za-z0-9]+\))?|Reason(?:\s*\([A-Za-z0-9]+\))?|કથન(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|કારણ(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|[1-9]\d?[\.\)]|\([1-9]\d?\)|\([iIvVxX]+\)|[iIvVxX]+[\.\)]|\([a-dA-D]\)|[A-D][\.\)])\s+))/gi;
    const parts = single.split(splitRegex).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      lines = parts;
    }
  }

  const statementMarkerRegex =
    /^(?:Assertion(?:\s*\([A-Za-z0-9]+\))?|Reason(?:\s*\([A-Za-z0-9]+\))?|કથન(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|કારણ(?:\s*\([A-Za-z0-9\u0A80-\u0AFF]+\))?|વિધાન\s*\d+|Statement\s*\d+|[1-9]\d?[\.\)]|\([1-9]\d?\)|\([iIvVxX]+\)|[iIvVxX]+[\.\)]|\([a-dA-D]\)|[A-D][\.\)])[\:\s]+/i;

  const isStatement = (l: string) => statementMarkerRegex.test(l);
  const hasStatements = lines.some(isStatement);

  if (!hasStatements) {
    return {
      premise: autoFormatCodeAndMath(normalizeBulletLists(text)),
      statements: [],
      prompt: "",
      isMultiStatement: false,
      isMatching: false,
    };
  }

  const premiseLines: string[] = [];
  const statementLines: string[] = [];
  const promptLines: string[] = [];
  let stage: "premise" | "statements" | "prompt" = "premise";

  for (const line of lines) {
    if (isStatement(line)) {
      stage = "statements";
      statementLines.push(line);
    } else if (stage === "statements") {
      if (
        /^(?:Which|Choose|Select|Identify|Find|ઉપરોક્ત|નીચેના|આ પૈકી|કયું|કયા)/i.test(line) ||
        (statementLines.length >= 4 && !/^(?:List|Column|સ્તંભ|સૂચિ)/i.test(line))
      ) {
        stage = "prompt";
        promptLines.push(line);
      } else {
        statementLines[statementLines.length - 1] += " " + line;
      }
    } else if (stage === "premise") {
      premiseLines.push(line);
    } else {
      promptLines.push(line);
    }
  }

  const formattedStatements = statementLines.map(extractStatementParts);
  const rawPremiseText = premiseLines.join("\n").trim();
  const premiseText = autoFormatCodeAndMath(normalizeBulletLists(rawPremiseText));
  const matchingColumns = extractMatchingColumns(premiseText, formattedStatements);

  return {
    premise: premiseText,
    statements: formattedStatements,
    matchingColumns,
    prompt: autoFormatCodeAndMath(promptLines.join("\n").trim()),
    isMultiStatement: formattedStatements.length > 0,
    isMatching: !!matchingColumns,
  };
}

/**
 * Rich formatted markdown text component for rendering formulas, bullet lists, code blocks, and markdown.
 */
function FormattedRichText({ content, className }: { content: string; className?: string }) {
  const formatted = React.useMemo(() => autoFormatCodeAndMath(content), [content]);

  return (
    <div
      className={cn(
        "markdown-question-text leading-relaxed break-words",
        "[&_.katex-display]:my-1.5 [&_.katex-display]:p-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:rounded-lg [&_.katex-display]:bg-secondary/40 [&_.katex-display]:border [&_.katex-display]:border-border/50 [&_.katex-display]:text-center [&_.katex-display]:shadow-2xs",
        "[&_.katex-html]:overflow-x-auto [&_.katex-html]:overflow-y-hidden",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-1.5 ml-5 list-disc space-y-1 text-foreground/90">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 ml-5 list-decimal space-y-1 text-foreground/90">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : undefined;
            const codeString = String(children).replace(/\n$/, "");
            const isBlock = match || codeString.includes("\n");

            if (isBlock) {
              return <CodeBlock code={codeString} language={language} />;
            }

            return (
              <code
                className="inline-block px-2 py-0.5 mx-0.5 rounded-md font-mono text-[12px] sm:text-[13px] font-medium bg-secondary/80 dark:bg-zinc-800/90 text-foreground dark:text-zinc-100 border border-border/90 dark:border-zinc-700 shadow-2xs select-text"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}

/**
 * QuestionText — beautifully renders standard, code snippet, math equation,
 * pair matching, and multi-statement competitive exam questions.
 */
export function QuestionText({
  text,
  index,
  className,
  size = "base",
  isCompact = false,
}: QuestionTextProps) {
  const parsed = React.useMemo(() => parseQuestionText(text), [text]);

  const textSizeClass =
    size === "sm"
      ? "text-xs sm:text-sm"
      : size === "lg"
      ? "text-base sm:text-lg"
      : "text-sm sm:text-base";

  // 1. Standard single-premise question
  if (!parsed.isMultiStatement && !parsed.isMatching) {
    return (
      <div className={cn("leading-relaxed text-foreground font-semibold break-words", textSizeClass, className)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <FormattedRichText content={parsed.premise || text} />
      </div>
    );
  }

  // 2. Compact header view for accordions / dense lists
  if (isCompact) {
    return (
      <div className={cn("leading-snug text-foreground font-semibold break-words", textSizeClass, className)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <span>{parsed.premise}</span>
        {parsed.isMatching ? (
          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 select-none">
            <ArrowLeftRight className="h-2.5 w-2.5" />
            Match Pairs
          </span>
        ) : (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 select-none">
            {parsed.statements.length} Statements
          </span>
        )}
      </div>
    );
  }

  // 3. Match the Following / Dual Column Matching Grid View
  if (parsed.isMatching && parsed.matchingColumns) {
    const { left, right } = parsed.matchingColumns;

    return (
      <div className={cn("flex flex-col gap-3 text-foreground break-words", className)}>
        {/* Premise Header */}
        <div className={cn("font-semibold leading-relaxed text-foreground", textSizeClass)}>
          {typeof index === "number" && (
            <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
          )}
          <FormattedRichText content={parsed.premise} />
        </div>

        {/* Dual-Column Matching Card */}
        <div className="bg-secondary/20 dark:bg-zinc-900/40 border border-border/70 rounded-2xl p-3.5 sm:p-5 my-1 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Left Column (List I) */}
            <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-xl bg-card/90 dark:bg-zinc-950/60 border border-border/60">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-bold text-primary tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {left.title || "List I"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {left.items.length} Items
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {left.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/30 dark:bg-zinc-900/50 border border-border/40 text-xs sm:text-sm"
                  >
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold select-none mt-0.5">
                      {item.label}
                    </span>
                    <div className="flex-1 font-medium text-foreground/95 leading-relaxed">
                      <FormattedRichText content={item.content} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (List II) */}
            <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-xl bg-card/90 dark:bg-zinc-950/60 border border-border/60">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  {right.title || "List II"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {right.items.length} Matches
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {right.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/30 dark:bg-zinc-900/50 border border-border/40 text-xs sm:text-sm"
                  >
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-bold select-none mt-0.5">
                      {item.label}
                    </span>
                    <div className="flex-1 font-medium text-foreground/95 leading-relaxed">
                      <FormattedRichText content={item.content} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trailing Question Prompt */}
          {parsed.prompt && (
            <div className="pt-3 mt-3 border-t border-border/50 font-semibold text-xs sm:text-sm text-foreground">
              <FormattedRichText content={parsed.prompt} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Standard Multi-Statement Presentation (Assertion-Reason / Statements (1), (2), (3), (4))
  return (
    <div className={cn("flex flex-col gap-3 text-foreground break-words", className)}>
      {/* Premise Header */}
      <div className={cn("font-semibold leading-relaxed text-foreground", textSizeClass)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <FormattedRichText content={parsed.premise} />
      </div>

      {/* Structured Statements Box */}
      {parsed.statements.length > 0 && (
        <div className="bg-secondary/30 dark:bg-zinc-900/50 border border-border/70 rounded-xl p-3.5 sm:p-4 my-1 flex flex-col gap-2.5 shadow-2xs">
          {parsed.statements.map((stmt, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-foreground/90 leading-relaxed group"
            >
              {stmt.label ? (
                <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold flex items-center justify-center select-none shadow-2xs mt-0.5">
                  {stmt.label}
                </span>
              ) : (
                <span className="shrink-0 w-2 h-2 rounded-full bg-primary/60 mt-2" />
              )}
              <div className="flex-1 font-normal text-foreground/95">
                <FormattedRichText content={stmt.content} />
              </div>
            </div>
          ))}

          {/* Trailing Question Prompt */}
          {parsed.prompt && (
            <div className="pt-2.5 mt-1 border-t border-border/50 font-semibold text-xs sm:text-sm text-foreground">
              <FormattedRichText content={parsed.prompt} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionText;
