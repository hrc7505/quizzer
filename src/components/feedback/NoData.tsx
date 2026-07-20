"use client";

import * as React from "react";
import { AlertCircle, BookOpen, Sparkles, Brain } from "lucide-react";
import { cn } from "@/utils/cn";

const iconMap: Record<string, React.ReactNode> = {
  warning: <AlertCircle className="h-5 w-5" />,
  book: <BookOpen className="h-5 w-5" />,
  sparkle: <Sparkles className="h-5 w-5" />,
  brain: <Brain className="h-5 w-5" />,
};

interface NoDataProps {
  title: string;
  description?: string;
  icon?: "warning" | "book" | "sparkle" | "brain" | React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export function NoData({ 
  title, 
  description, 
  icon = "warning", 
  action, 
  compact = false 
}: NoDataProps) {
  
  const resolvedIcon = icon && typeof icon === "string" ? iconMap[icon] : icon;

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center w-full box-border animate-fade-in-up",
        compact 
          ? "py-6 px-4 bg-transparent border-0 gap-1.5" 
          : "py-12 px-6 bg-card border border-dashed border-border rounded-2xl gap-2 shadow-xs"
      )}
    >
      {resolvedIcon && (
        <div 
          className={cn(
            "flex items-center justify-center rounded-full shrink-0",
            compact 
              ? "w-10 h-10 bg-secondary text-muted-foreground/60 mb-1" 
              : "w-14 h-14 bg-primary/10 text-primary mb-3 shadow-xs border border-primary/10"
          )}
        >
          {resolvedIcon}
        </div>
      )}
      
      <span className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </span>
      
      {description && (
        <span className="text-xs text-muted-foreground leading-relaxed max-w-[360px] mt-0.5">
          {description}
        </span>
      )}
      
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export default NoData;
