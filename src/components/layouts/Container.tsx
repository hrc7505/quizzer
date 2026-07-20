import { type ElementType, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export const CONTAINER_MAX_WIDTH = "1100px";

interface ContainerProps {
  children: ReactNode;
  as?: ElementType;
  maxWidth?: string;
  className?: string;
}

/**
 * Standardized content container used across all public pages so the NavBar,
 * page content, and section widths stay visually consistent (1100px).
 */
export function Container({ children, as: Tag = "div", maxWidth = CONTAINER_MAX_WIDTH, className }: ContainerProps) {
  return (
    <Tag
      className={cn("w-full mx-auto px-4 sm:px-6 lg:px-8", className)}
      style={{ maxWidth }}
    >
      {children}
    </Tag>
  );
}
