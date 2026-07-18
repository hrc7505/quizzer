import * as React from "react";
import { cn } from "@/utils/cn";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center space-x-3 cursor-pointer select-none", className)}>
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className="w-9 h-5 rounded-full border border-border/80 bg-secondary peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-border after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
        </div>
        {label && (
          <span className="text-sm font-medium text-foreground/90">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
