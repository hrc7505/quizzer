"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/utils/cn";

/**
 * Supported notification severity levels.
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Representation of a toast notification entity.
 */
export interface Toast {
  /** Unique notification identifier */
  id: string;
  /** Toast visual theme and icon */
  type: ToastType;
  /** Optional bold headline */
  title?: string;
  /** Primary message content */
  message: string;
  /** Display duration in milliseconds (0 for persistent) */
  duration?: number;
}

/**
 * Optional parameter overrides when dispatching a toast.
 */
export interface ToastOptions {
  /** Optional bold headline */
  title?: string;
  /** Display duration in milliseconds */
  duration?: number;
}

/**
 * Toast context value providing dispatcher and convenience helpers.
 */
export interface ToastContextValue {
  /** Dispatches a full toast object */
  addToast: (toast: Omit<Toast, "id">) => void;
  /** Manually dismisses a toast by ID */
  removeToast: (id: string) => void;
  /** Convenience helper to trigger a success toast */
  success: (message: string, title?: string, options?: ToastOptions) => void;
  /** Convenience helper to trigger an error toast */
  error: (message: string, title?: string, options?: ToastOptions) => void;
  /** Convenience helper to trigger a warning toast */
  warning: (message: string, title?: string, options?: ToastOptions) => void;
  /** Convenience helper to trigger an informational toast */
  info: (message: string, title?: string, options?: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const noopToastContext: ToastContextValue = {
  addToast: () => {},
  removeToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
};

/**
 * Hook to access the site-wide Toast notification engine.
 *
 * @example
 * ```tsx
 * const { success, error } = useToast();
 * success("Quiz updated successfully!", "Saved");
 * ```
 */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  return ctx ?? noopToastContext;
}

/**
 * Static visual configuration for each toast type (allocated once for performance).
 */
const TOAST_TYPE_CONFIG: Record<
  ToastType,
  {
    icon: React.ReactNode;
    badgeBg: string;
    borderColor: string;
    ringColor: string;
    accentBar: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    badgeBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
    borderColor: "border-emerald-500/40 dark:border-emerald-500/50",
    ringColor: "ring-emerald-500/20",
    accentBar: "bg-emerald-500",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    badgeBg: "bg-rose-500/15 dark:bg-rose-500/25",
    borderColor: "border-rose-500/40 dark:border-rose-500/50",
    ringColor: "ring-rose-500/20",
    accentBar: "bg-rose-500",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    badgeBg: "bg-amber-500/15 dark:bg-amber-500/25",
    borderColor: "border-amber-500/40 dark:border-amber-500/50",
    ringColor: "ring-amber-500/20",
    accentBar: "bg-amber-500",
  },
  info: {
    icon: <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
    badgeBg: "bg-indigo-500/15 dark:bg-indigo-500/25",
    borderColor: "border-indigo-500/40 dark:border-indigo-500/50",
    ringColor: "ring-indigo-500/20",
    accentBar: "bg-indigo-500",
  },
};

/**
 * Site-wide Toast Provider managing notification states, timers, and portals.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (message: string, title?: string, options?: ToastOptions) => {
      addToast({ type: "success", message, title, ...options });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string, options?: ToastOptions) => {
      addToast({ type: "error", message, title, ...options });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string, options?: ToastOptions) => {
      addToast({ type: "warning", message, title, ...options });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string, options?: ToastOptions) => {
      addToast({ type: "info", message, title, ...options });
    },
    [addToast]
  );

  // Clean up all pending timers on provider unmount
  React.useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [addToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Individual memoized Toast card item for high-performance rendering.
 */
const ToastItem = React.memo(function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = TOAST_TYPE_CONFIG[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-2xl border p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in",
        "bg-card/98 dark:bg-slate-900/98 backdrop-blur-xl ring-1 shadow-black/15 dark:shadow-black/40",
        config.borderColor,
        config.ringColor
      )}
    >
      {/* Left Vertical Brand Accent Line */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.accentBar)} />

      {/* Icon Pill */}
      <div
        className={cn(
          "flex items-center justify-center p-1.5 rounded-xl shrink-0 mt-0.5",
          config.badgeBg
        )}
      >
        {config.icon}
      </div>

      {/* Content Body with High Contrast */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <p className="font-bold text-sm text-foreground leading-snug tracking-tight mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-xs sm:text-[13px] font-semibold text-foreground dark:text-slate-100 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-surface-hover dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

/**
 * Viewport portal container rendering all active toast notifications.
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-40px)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}
