import * as React from "react";
import { cn } from "@/utils/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 stroke-[2.5]",
    md: "h-6 w-6 stroke-[2]",
    lg: "h-8 w-8 stroke-[1.5]",
  };
  
  return (
    <div
      role="status"
      className={cn("flex items-center justify-center text-primary/80 animate-fade-in", className)}
      {...props}
    >
      <svg
        className={cn("animate-spin", sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
