import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/utils/cn";

const alertVariants = cva(
  "relative flex gap-3 rounded-xl border border-border bg-surface p-4 text-sm transition-all duration-200 animate-fade-in-up",
  {
    variants: {
      variant: {
        danger: "text-danger",
        warning: "text-warning",
        success: "text-success",
        info: "text-info",
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

const ICON_BG: Record<string, string> = {
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: boolean;
  customIcon?: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "danger", title, icon = true, customIcon, onDismiss, children, ...props }, ref) => {
    const DefaultIcon = ICONS[variant ?? "danger"];
    const resolvedIcon = customIcon ?? (icon ? <DefaultIcon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null);
    const iconBg = ICON_BG[variant ?? "danger"];
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {resolvedIcon && (
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
            {resolvedIcon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold mb-0.5 text-[13px]">{title}</div>}
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
