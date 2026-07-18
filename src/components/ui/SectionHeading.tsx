"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-lg font-bold text-foreground border-b border-border/80 pb-2 mb-4 tracking-tight animate-fade-in-up",
        className
      )}
    >
      {children}
    </h2>
  );
}
