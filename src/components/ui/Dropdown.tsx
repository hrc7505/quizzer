"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

interface DropdownProps {
  children: React.ReactNode;
}

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

export function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      // Use "click" (not "mousedown") so menu-item onClick runs before close.
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function useDropdown() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown compound components must be rendered within a <Dropdown> provider");
  }
  return context;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && "current" in ref) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

export function DropdownTrigger({ children }: { children: React.ReactElement }) {
  const { open, setOpen, triggerRef } = useDropdown();
  const childRef = (children.props as { ref?: React.Ref<HTMLElement> }).ref;
  const childOnClick = (children.props as { onClick?: (e: React.MouseEvent) => void }).onClick;
  return React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      setRef(childRef, node);
    },
    onClick: (e: React.MouseEvent) => {
      if (childOnClick) childOnClick(e);
      setOpen(!open);
    },
  } as Record<string, unknown>);
}

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "right";
}

export function DropdownContent({ className, align = "right", children, ...props }: DropdownContentProps) {
  const { open, triggerRef, contentRef } = useDropdown();
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  const recalc = React.useCallback(() => {
    const anchor = triggerRef.current;
    const content = contentRef.current;
    if (!anchor || !content) return;
    const rect = anchor.getBoundingClientRect();
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    let left = align === "left" ? rect.left : rect.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = rect.bottom + 6;
    if (top + h > window.innerHeight - 8 && rect.top - h - 6 > 8) {
      top = rect.top - h - 6;
    }
    setPos({ top, left });
  }, [triggerRef, align, contentRef]);

  React.useEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open, recalc]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1300 }}
      className={cn(
        "min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-md text-foreground animate-popover-in focus:outline-none",
        align === "right" && "origin-top-right",
        align === "left" && "origin-top-left",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "danger";
  icon?: React.ReactNode;
}

export function DropdownItem({
  className,
  variant = "default",
  icon,
  children,
  onClick,
  ...props
}: DropdownItemProps) {
  const { setOpen } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer select-none active:scale-[0.98]",
        variant === "default" && "text-foreground hover:bg-surface-hover",
        variant === "danger" && "text-danger hover:bg-danger/10",
        className
      )}
      onClick={(e) => {
        if (onClick) onClick(e);
        setOpen(false);
      }}
      {...props}
    >
      {icon && <span className="mr-2 h-4 w-4 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}
