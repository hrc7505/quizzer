"use client";

import * as React from "react";
import { ZoomIn, X } from "lucide-react";

import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { sanitizeImageUrl } from "@/lib/format";
import { cn } from "@/utils/cn";
import type { QuestionImageProps } from "@/components/data-display/interfaces/QuestionImage.interface";

/**
 * QuestionImage — reusable image component for question diagrams, schematics,
 * and equations with dark-mode invert support and interactive zoom lightbox.
 */
export function QuestionImage({
  src,
  alt = "Question diagram",
  invertInDark = true,
  variant = "display",
  className,
  loading,
}: QuestionImageProps) {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const safeImageUrl = React.useMemo(() => sanitizeImageUrl(src), [src]);

  // Handle ESC key press for closing zoom modal
  React.useEffect(() => {
    if (!isZoomed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomed]);

  if (!safeImageUrl) return null;

  // 1. Compact Thumbnail Variant (for QuestionCard in management lists)
  if (variant === "thumbnail") {
    return (
      <div className={cn("flex justify-start min-w-0 max-w-full", className)}>
        <div className="p-2.5 border border-border/70 rounded-xl bg-card/60 dark:bg-zinc-950/80 max-w-xs overflow-hidden flex items-center justify-center">
          <ShimmerImage
            src={safeImageUrl}
            alt={alt}
            invertInDark={invertInDark}
            containerClassName="min-h-[90px] w-full max-w-xs"
            className="max-h-36 w-auto object-contain"
            loading={loading ?? "lazy"}
          />
        </div>
      </div>
    );
  }

  // 2. Display Variant (for DetailedQuestionAccordion or full question views)
  if (variant === "display") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card/60 dark:bg-zinc-950/80 overflow-hidden min-w-0 max-w-full",
          className
        )}
      >
        <ShimmerImage
          src={safeImageUrl}
          alt={alt}
          invertInDark={invertInDark}
          containerClassName="min-h-[140px] w-full max-w-lg"
          className="max-h-60 w-auto object-contain"
          loading={loading ?? "lazy"}
        />
      </div>
    );
  }

  // 3. Interactive Variant with Zoom Lightbox (for active Quiz taker)
  return (
    <div className={cn("flex flex-col gap-2 min-w-0 max-w-full", className)}>
      <div
        onClick={() => setIsZoomed(true)}
        className="group relative flex items-center justify-center p-3 sm:p-4 rounded-xl border border-border/70 bg-card/60 dark:bg-zinc-950/80 overflow-hidden cursor-zoom-in hover:border-primary/50 transition-colors"
      >
        <ShimmerImage
          src={safeImageUrl}
          alt={alt}
          invertInDark={invertInDark}
          containerClassName="min-h-[160px] w-full max-w-xl"
          className="max-h-64 sm:max-h-72 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]"
          loading={loading ?? "eager"}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-xs text-[11px] font-semibold text-muted-foreground px-2 py-1 rounded-md border border-border/60 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 select-none">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Enlarge</span>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-border/40 mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                Question Diagram
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] w-full overflow-auto flex items-center justify-center bg-card/60 dark:bg-zinc-950/80 p-4 rounded-xl border border-border/40">
              <img
                src={safeImageUrl}
                alt={`${alt} full view`}
                className={cn(
                  "max-h-[70vh] max-w-full object-contain",
                  invertInDark && "dark:invert"
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionImage;
