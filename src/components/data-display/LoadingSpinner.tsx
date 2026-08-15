"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
  iconClassName?: string;
}

export function LoadingSpinner({
  text = "Loading...",
  className,
  iconClassName,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground select-none", className)}>
      <Loader2 className={cn("h-6 w-6 animate-spin text-primary", iconClassName)} />
      <span>{text}</span>
    </div>
  );
}
