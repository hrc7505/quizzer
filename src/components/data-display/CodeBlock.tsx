"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/utils/cn";

import type { CodeBlockProps } from "@/components/data-display/interfaces/CodeBlock.interface";

/**
 * Modern syntax-styled CodeBlock component with language badge,
 * line numbering, and one-click clipboard copy.
 * Optimized for mobile responsive layouts with horizontal touch scrolling.
 */
export function CodeBlock({
  code,
  language,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const cleanCode = React.useMemo(() => {
    return (code || "").replace(/\r\n/g, "\n").trimEnd();
  }, [code]);

  const handleCopy = React.useCallback(async () => {
    if (!cleanCode) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanCode);
      } else {
        throw new Error("Clipboard API not available");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers or restricted iframe environments
      try {
        const textarea = document.createElement("textarea");
        textarea.value = cleanCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn("Failed to copy code block:", err);
      }
    }
  }, [cleanCode]);

  const displayLang = React.useMemo(() => {
    return (language || "code").toLowerCase();
  }, [language]);

  const lines = React.useMemo(() => {
    return cleanCode.split("\n");
  }, [cleanCode]);

  return (
    <div
      className={cn(
        "group relative my-2.5 sm:my-3 min-w-0 max-w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md transition-all",
        className
      )}
    >
      {/* Header bar with language identifier & Copy button */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3 sm:px-3.5 py-1.5 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/30 truncate">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents with responsive scroll */}
      <div className="overflow-x-auto max-w-full p-3 sm:p-4 text-[11.5px] sm:text-[13px] font-mono leading-relaxed touch-pan-x">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="pr-3.5 text-right text-zinc-600 select-none text-[10.5px] sm:text-[11px] w-6 align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-zinc-100 align-top break-normal">
                    {line || "\n"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="m-0 p-0 font-mono whitespace-pre text-zinc-100 break-normal">
            <code>{cleanCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export default CodeBlock;
