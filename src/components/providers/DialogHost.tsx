"use client";

import * as React from "react";
import { X, Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface DialogConfig {
  title?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  okText?: string;
  cancelText?: string;
  okVariant?: "primary" | "danger";
  busyText?: string;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okDisabled?: boolean;
}

interface DialogHostProps {
  config: DialogConfig | null;
  onClose: () => void;
}

export function DialogHost({ config, onClose }: DialogHostProps) {
  const [okBusy, setOkBusy] = React.useState(false);
  const [prevConfig, setPrevConfig] = React.useState<DialogConfig | null>(config);
  const contentRef = useFocusTrap<HTMLDivElement>(config);

  if (config !== prevConfig) {
    setOkBusy(false);
    setPrevConfig(config);
  }

  if (!config) return null;

  const handleOk = async () => {
    if (config.onOk) {
      setOkBusy(true);
      try {
        await config.onOk();
      } finally {
        setOkBusy(false);
      }
    }
    onClose();
  };

  const getBusyText = () => {
    if (config.busyText) return config.busyText;
    const okText = typeof config.okText === "string" ? config.okText.trim() : "";
    const lower = okText.toLowerCase();
    if (!okText || lower === "ok" || lower === "confirm") {
      return config.okVariant === "danger" ? "Deleting…" : "Processing…";
    }
    if (lower.includes("delete") || lower.includes("remove")) return "Deleting…";
    if (lower.includes("save")) return "Saving…";
    if (lower.includes("proofread")) return "Proofreading…";
    if (lower.includes("translate") || lower.includes("localize")) return "Translating…";
    if (lower.includes("merge")) return "Merging…";
    if (lower.includes("generate")) return "Generating…";
    return `${okText}…`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-overlay/50 backdrop-blur-xs transition-all duration-200 animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl animate-scale-in text-foreground my-auto",
          config.className
        )}
      >
        {config.title !== undefined && (
          <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-3 shrink-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate pr-2">{config.title}</h2>
            {config.showClose !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md hover:bg-surface-hover opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="text-sm text-muted-foreground leading-relaxed overflow-y-auto px-1.5 py-0.5 overscroll-contain flex-1">
          {config.body}
        </div>
        {config.footer !== undefined ? (
          <div className="shrink-0 mt-4 pt-3 border-t border-border/30">{config.footer}</div>
        ) : (
          (config.onOk || config.onCancel) && (
            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-border/30 shrink-0">
              {config.onCancel !== undefined && (
                <Button variant="outline" onClick={onClose} className="h-9 px-3 text-xs font-semibold">
                  {config.cancelText ?? "Cancel"}
                </Button>
              )}
              {config.onOk !== undefined && (
                <Button
                  variant={config.okVariant ?? "primary"}
                  onClick={handleOk}
                  disabled={config.okDisabled || okBusy}
                  className="h-9 px-4 text-xs font-semibold gap-1.5"
                >
                  {okBusy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{getBusyText()}</span>
                    </>
                  ) : (
                    config.okText ?? "OK"
                  )}
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
