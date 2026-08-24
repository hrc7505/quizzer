"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/utils/cn";

import type { CodeBlockProps } from "@/components/data-display/interfaces/CodeBlock.interface";

/**
 * Modern syntax-styled CodeBlock component with language badge and one-click copy.
 * Designed for programming exam questions and multi-language code snippets.
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
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
      const textarea = document.createElement("textarea");
      textarea.value = cleanCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [cleanCode]);

  const displayLang = (language || "code").toLowerCase();

  const lines = React.useMemo(() => {
    return cleanCode.split("\n");
  }, [cleanCode]);

  return (
    <div
      className={cn(
        "group relative my-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md transition-all",
        className
      )}
    >
      {/* Header bar with language identifier & Copy button */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3.5 py-1.5 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/30">
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
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

      {/* Code contents */}
      <div className="overflow-x-auto p-3.5 sm:p-4 text-[12px] sm:text-[13px] font-mono leading-relaxed">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="pr-4 text-right text-zinc-600 select-none text-[11px] w-6 align-top">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-zinc-100 align-top">
                    {line || "\n"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="m-0 p-0 font-mono whitespace-pre text-zinc-100">
            <code>{cleanCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export default CodeBlock;
