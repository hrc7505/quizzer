"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] duration-150 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-surface-hover border border-border/80 shadow-xs",
        outline: "border border-border bg-transparent hover:bg-surface-hover text-foreground",
        ghost: "hover:bg-surface-hover hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline bg-transparent p-0 active:scale-100",
        danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
      if (asChild) {
        const { children: _children, ...rest } = props;
        const child = React.Children.only(_children) as React.ReactElement;
        const childProps = child.props as { className?: string };
        return React.cloneElement(child, {
          ...rest,
          className: cn(buttonVariants({ variant, size }), className, childProps.className),
        } as Record<string, unknown>);
      }
      return (
        <button
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        />
      );
    }
  );
Button.displayName = "Button";

export { Button, buttonVariants };
