"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

export interface DialogConfig {
  title?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  okText?: string;
  cancelText?: string;
  okVariant?: "primary" | "danger";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-overlay/50 backdrop-blur-xs transition-all duration-200 animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-scale-in text-foreground",
          config.className
        )}
      >
        {config.title !== undefined && (
          <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
            <h2 className="text-lg font-semibold tracking-tight">{config.title}</h2>
            {config.showClose !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-surface-hover opacity-70 hover:opacity-100"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="text-sm text-muted-foreground leading-relaxed">{config.body}</div>
        {config.footer !== undefined ? (
          config.footer
        ) : (
          (config.onOk || config.onCancel) && (
            <div className="flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30">
              {config.onCancel !== undefined && (
                <Button variant="outline" onClick={onClose}>
                  {config.cancelText ?? "Cancel"}
                </Button>
              )}
              {config.onOk !== undefined && (
                <Button
                  variant={config.okVariant ?? "primary"}
                  onClick={handleOk}
                  disabled={config.okDisabled || okBusy}
                >
                  {config.okText ?? "OK"}
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
