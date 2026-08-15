"use client";

import * as React from "react";
import { ImageOff, Info } from "lucide-react";

interface ModelCapabilityErrorProps {
  message?: string;
  onDismiss?: () => void;
}

export function ModelCapabilityError({ message, onDismiss }: ModelCapabilityErrorProps) {
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  const displayMessage = message || "This model can only process text. Upload a text-based PDF or use the text/topic input instead.";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-warning">
          <ImageOff className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">Image input not supported</span>
            {onDismiss && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 text-muted-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{displayMessage}</p>
          <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
            <Info className="h-3 w-3 shrink-0" />
            <span>This AI model processes text only. It cannot read images, diagrams, or scanned pages.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelCapabilityError;
