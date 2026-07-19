import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none animate-scale-in",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-success/10 text-success hover:bg-success/15",
        warning: "border-transparent bg-warning/10 text-warning hover:bg-warning/15",
        danger: "border-transparent bg-danger/10 text-danger hover:bg-danger/15",
        info: "border-transparent bg-info/10 text-info hover:bg-info/15",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
}

function Badge({ className, variant, animate = false, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), !animate && "animate-none", className)} {...props} />
  );
}

export { Badge, badgeVariants };
