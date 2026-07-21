import * as React from "react";

import { cn } from "@/utils/cn";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div
        className={cn(
          "absolute z-50 scale-95 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-tooltip text-tooltip-foreground text-xs font-medium shadow-md whitespace-nowrap border border-border/10",
          className
        )}
      >
        {content}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-tooltip" />
      </div>
    </div>
  );
}
