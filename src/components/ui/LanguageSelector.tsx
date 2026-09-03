"use client";

import * as React from "react";
import { Globe, Check, ChevronDown } from "lucide-react";

import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/utils/cn";

import type { LanguageSelectorProps } from "@/components/ui/interfaces/LanguageSelector.interface";

/**
 * LanguageSelector — interactive dropdown allowing users to switch between
 * English, Gujarati (ગુજરાતી), and Hindi (हिन्दी) with immediate font & UI updates.
 */
export function LanguageSelector({
  className,
  variant = "dropdown",
  showFlags = true,
}: LanguageSelectorProps) {
  const { lang, languages, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeLang = languages.find((l) => l.code === lang) || languages[0];

  // 1. Segmented Pill Variant (e.g. for settings or quiz footer)
  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-1 rounded-xl bg-secondary/80 border border-border/70 shadow-2xs gap-1",
          className
        )}
      >
        {languages.map((l) => {
          const isActive = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              )}
            >
              {showFlags && (
                <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {l.glyph}
                </span>
              )}
              <span>{l.nativeLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Compact Pill Variant (e.g. for mobile bar)
  if (variant === "compact") {
    return (
      <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/80 bg-surface text-foreground hover:bg-surface-hover text-xs font-semibold shadow-2xs cursor-pointer select-none transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span>{activeLang.nativeLabel}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute right-0 mt-1.5 w-40 rounded-xl border border-border/80 bg-card p-1.5 shadow-lg z-50 animate-fade-in"
          >
            {languages.map((l) => {
              const isActive = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none",
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {showFlags && (
                <span className="w-4 h-4 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {l.glyph}
                </span>
              )}
                    <span>{l.nativeLabel}</span>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. Default Header Dropdown Variant
  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/70 bg-surface text-foreground hover:bg-surface-hover text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span>{activeLang.nativeLabel}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground/80" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-44 rounded-xl border border-border/80 bg-card p-1.5 shadow-xl z-50 animate-fade-in"
        >
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1 select-none">
            Choose Language
          </div>
          {languages.map((l) => {
            const isActive = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none",
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {l.glyph}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="leading-snug">{l.nativeLabel}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {l.label}
                    </span>
                  </div>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
