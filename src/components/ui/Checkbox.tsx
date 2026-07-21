import * as React from "react";

import { cn } from "@/utils/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "h-4 w-4 rounded border-input text-primary bg-surface transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus-visible:outline-none cursor-pointer accent-primary",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-sm font-medium text-foreground/90">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
