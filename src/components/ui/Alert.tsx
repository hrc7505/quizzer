import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/utils/cn";

const alertVariants = cva(
  "relative flex gap-3 rounded-lg border p-3.5 text-sm transition-all duration-200 animate-fade-in-up",
  {
    variants: {
      variant: {
        danger: "border-danger/25 bg-danger/10 text-danger",
        warning: "border-warning/25 bg-warning/10 text-warning",
        success: "border-success/25 bg-success/10 text-success",
        info: "border-info/25 bg-info/10 text-info",
      },
      tone: {
        solid: "",
        soft: "",
      },
    },
    defaultVariants: {
      variant: "danger",
    },
  }
);

const ICONS = {
  danger: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: boolean;
  onDismiss?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "danger", title, icon = true, onDismiss, children, ...props }, ref) => {
    const Icon = ICONS[variant ?? "danger"];
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {icon && (
          <Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold mb-0.5">{title}</div>}
          {children && <div className={cn(title ? "font-medium text-[13px] leading-relaxed" : "font-medium")}>{children}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 -mr-1 -mt-1 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";
