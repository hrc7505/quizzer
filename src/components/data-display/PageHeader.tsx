"use client";

import * as React from "react";

import { cn } from "@/utils/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5", className)}>
      <div>
        <h1 className={cn("text-xl font-bold tracking-tight text-foreground flex items-center gap-2", titleClassName)}>
          <span>{title}</span>
          {badge}
        </h1>
        {description && (
          <p className={cn("text-xs text-muted-foreground mt-0.5", descriptionClassName)}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
