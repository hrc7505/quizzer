"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ContentHeaderVariant = "exam" | "topic" | "subtopic" | "quiz";

interface ContentHeaderProps {
  icon: ReactNode;
  variant?: ContentHeaderVariant;
  title: string;
  description?: string | null;
}

const GRADIENT_CLASSES: Record<ContentHeaderVariant, string> = {
  exam: "from-info to-primary",
  topic: "from-primary to-accent",
  subtopic: "from-info to-accent",
  quiz: "from-success to-primary",
};

export function ContentHeader({ 
  icon, 
  variant = "exam", 
  title, 
  description 
}: ContentHeaderProps) {
  
  const gradientClass = GRADIENT_CLASSES[variant];

  return (
    <div className="flex items-start gap-4 mb-8">
      {/* Icon badge with gradient backdrop */}
      <div 
        className={cn(
          "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-sm border border-white/10",
          gradientClass
        )}
      >
        <span className="scale-110">{icon}</span>
      </div>
      
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
