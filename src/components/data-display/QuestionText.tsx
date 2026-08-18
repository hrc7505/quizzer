"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import type {
  FormattedStatement,
  ParsedQuestionData,
  QuestionTextProps,
} from "@/components/data-display/interfaces/QuestionText.interface";

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
 * Parses raw question text into premise, sub-statements list, and conclusion prompt.
 */
export function parseQuestionText(rawText: string): ParsedQuestionData {
  if (!rawText) {
    return { premise: "", statements: [], prompt: "", isMultiStatement: false };
  }

  // 1. Normalize line endings and trim
  let text = rawText.replace(/\r\n/g, "\n").trim();

  // 2. Strip redundant leading question index (e.g. "1. ", "45) ", "Q.1: ")
  text = text.replace(/^(?:Q(?:uestion)?[\.\:\s]*)?\d+[\.\)\:\-\]]\s+/i, "").trim();

  // 3. Split by existing newlines if present
  let lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 4. If single line or statements were joined into a run-on string, split inline statements
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
      premise: text,
      statements: [],
      prompt: "",
      isMultiStatement: false,
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
        statementLines.length >= 2
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

  return {
    premise: premiseLines.join(" ").trim(),
    statements: formattedStatements,
    prompt: promptLines.join(" ").trim(),
    isMultiStatement: formattedStatements.length > 0,
  };
}

/**
 * QuestionText — beautifully renders standard and multi-statement competitive exam questions.
 *
 * Automatically detects and formats multi-statement questions (1., 2., 3. or (i), (ii), (iii) or
 * Assertion-Reason / કથન-કારણ) with clear visual hierarchy, statement pills, and crisp typography.
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

  // If question is not multi-statement, render standard formatted text
  if (!parsed.isMultiStatement) {
    return (
      <div className={cn("leading-relaxed text-foreground font-semibold break-words", textSizeClass, className)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <span className="whitespace-pre-line">{parsed.premise || text}</span>
      </div>
    );
  }

  // Multi-statement compact view (e.g. for accordion headers or dense table rows)
  if (isCompact) {
    return (
      <div className={cn("leading-snug text-foreground font-semibold break-words", textSizeClass, className)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <span>{parsed.premise}</span>
        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 select-none">
          {parsed.statements.length} Statements
        </span>
      </div>
    );
  }

  // Full rich multi-statement presentation
  return (
    <div className={cn("flex flex-col gap-3 text-foreground break-words", className)}>
      {/* 1. Main Premise Header */}
      <div className={cn("font-semibold leading-relaxed text-foreground", textSizeClass)}>
        {typeof index === "number" && (
          <span className="text-primary font-bold mr-1.5 select-none">{index + 1}.</span>
        )}
        <span>{parsed.premise}</span>
      </div>

      {/* 2. Structured Statements Box */}
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
              <span className="flex-1 font-normal text-foreground/95">{stmt.content}</span>
            </div>
          ))}

          {/* 3. Trailing Question Prompt (if applicable) */}
          {parsed.prompt && (
            <div className="pt-2.5 mt-1 border-t border-border/50 font-semibold text-xs sm:text-sm text-foreground">
              {parsed.prompt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionText;
