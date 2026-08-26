"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const noopToastContext: ToastContextValue = {
  addToast: () => {},
  removeToast: () => {},
};

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  return ctx ?? noopToastContext;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = React.useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  };

  const colors: Record<ToastType, string> = {
    success: "border-success/40 bg-card text-success shadow-2xl",
    error: "border-danger/40 bg-card text-danger shadow-2xl",
    warning: "border-warning/40 bg-card text-warning shadow-2xl",
    info: "border-info/40 bg-card text-info shadow-2xl",
  };

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-2xl animate-fade-in-up text-sm bg-card/95 backdrop-blur-md",
            colors[toast.type]
          )}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            {toast.title && <p className="font-semibold text-foreground">{toast.title}</p>}
            <p className={cn("text-muted-foreground leading-relaxed", toast.title && "mt-0.5")}>{toast.message}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
