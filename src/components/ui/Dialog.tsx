"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog compound components must be rendered within a <Dialog> provider");
  }
  return context;
}

interface DialogTriggerProps {
  children: React.ReactElement;
}

function DialogTrigger({ children }: DialogTriggerProps) {
  const { onOpenChange } = useDialog();
  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (childProps.onClick) childProps.onClick(e);
      onOpenChange(true);
    },
  } as Record<string, unknown>);
}

type DialogSurfaceProps = React.HTMLAttributes<HTMLDivElement>;

const DialogSurface = React.forwardRef<HTMLDivElement, DialogSurfaceProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      let active = true;
      Promise.resolve().then(() => {
        if (active) setMounted(true);
      });
      return () => {
        active = false;
        setMounted(false);
      };
    }, []);

    if (!open || !mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-overlay/50 backdrop-blur-xs transition-all duration-200 animate-fade-in"
          onClick={() => onOpenChange(false)}
        />
        {/* Modal Surface */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-scale-in text-foreground",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
DialogSurface.displayName = "DialogSurface";

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  showClose?: boolean;
}

function DialogTitle({ className, children, showClose = true, ...props }: DialogTitleProps) {
  const { onOpenChange } = useDialog();
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
      <h2 className={cn("text-lg font-semibold tracking-tight", className)} {...props}>
        {children}
      </h2>
      {showClose && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md hover:bg-surface-hover opacity-70 hover:opacity-100"
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />;
}

function DialogActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end space-x-2 mt-6 pt-3 border-t border-border/30", className)} {...props} />;
}

function DialogTriggerClose({ children }: { children: React.ReactElement }) {
  const { onOpenChange } = useDialog();
  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (childProps.onClick) childProps.onClick(e);
      onOpenChange(false);
    },
  } as Record<string, unknown>);
}

export {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTriggerClose,
};
