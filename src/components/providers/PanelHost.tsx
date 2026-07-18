"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

export interface PanelConfig {
  title?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  side?: "right" | "left";
  width?: string;
  onClose?: () => void;
}

interface PanelHostProps {
  config: PanelConfig | null;
  onClose: () => void;
}

export function PanelHost({ config, onClose }: PanelHostProps) {
  if (!config) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex", config.side === "left" ? "justify-start" : "justify-end")}>
      <div
        className="fixed inset-0 bg-overlay/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 h-full w-full bg-card border-border p-6 shadow-lg flex flex-col overflow-y-auto text-foreground",
          config.side === "left" ? "border-r animate-slide-in-left" : "border-l animate-slide-in-right",
          config.width ?? "max-w-xl",
          config.className
        )}
      >
        {config.title !== undefined && (
          <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
            <h2 className="text-lg font-bold tracking-tight">{config.title}</h2>
            {config.showClose !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                onClick={onClose}
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto pr-1">{config.body}</div>
        {config.footer !== undefined && config.footer}
      </div>
    </div>
  );
}
