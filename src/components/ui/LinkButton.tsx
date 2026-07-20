"use client";

import Link from "next/link";
import { forwardRef } from "react";

import { Button, type ButtonProps } from "@/components/ui/Button";

export type LinkButtonProps = ButtonProps & {
  /** Destination route. Enables Next.js prefetching via the underlying Link. */
  href: string;
  /** Forwarded to next/link. Defaults to Link's own default (true on viewport). */
  prefetch?: boolean;
};

/**
 * A Next.js Link that renders styled like our design system Button.
 */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ href, prefetch = true, ...props }, ref) {
    return (
      <Link href={href} prefetch={prefetch} passHref legacyBehavior>
        <Button {...(props as Omit<ButtonProps, "asChild">)} asChild>
          <a ref={ref} className="no-underline inline-flex">
            {props.children}
          </a>
        </Button>
      </Link>
    );
  }
);
