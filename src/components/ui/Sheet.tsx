"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, onOpenChange]);

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet compound components must be rendered within a <Sheet> provider");
  }
  return context;
}

export function SheetTrigger({ children }: { children: React.ReactElement }) {
  const { onOpenChange } = useSheet();
  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (childProps.onClick) childProps.onClick(e);
      onOpenChange(true);
    },
  } as Record<string, unknown>);
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "right" | "left";
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const { open, onOpenChange } = useSheet();
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
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-overlay/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          onClick={() => onOpenChange(false)}
        />
        {/* Panel surface */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-50 h-full w-full max-w-xl bg-card border-l border-border p-6 shadow-lg flex flex-col justify-between overflow-y-auto animate-slide-in-right text-foreground",
            side === "left" && "left-0 border-r border-l-0 animate-slide-in-left",
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
SheetContent.displayName = "SheetContent";

export function SheetHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { onOpenChange } = useSheet();
  return (
    <div className={cn("flex items-center justify-between border-b border-border/50 pb-4 mb-5", className)} {...props}>
      <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        onClick={() => onOpenChange(false)}
        aria-label="Close panel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto pr-1", className)} {...props} />;
}
