"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { Button, type ButtonProps } from "@fluentui/react-components";

export type LinkButtonProps = ButtonProps & {
  /** Destination route. Enables Next.js prefetching via the underlying Link. */
  href: string;
  /** Forwarded to next/link. Defaults to Link's own default (true on viewport). */
  prefetch?: boolean;
};

/**
 * A Fluent UI v9 Button that renders as a next/link anchor.
 *
 * Using `as={Link}` makes the Button's root element the Next.js <Link>,
 * which hydrates the prefetch-on-viewport behaviour. This is the supported
 * way to keep Fluent styling while getting client-side prefetching, instead
 * of calling `router.push()` from an onClick handler.
 *
 * Prefer this over `<Link><Button/></Link>` (which nests a <button> inside an
 * <a>, invalid markup) and over `router.push()` (no prefetch).
 */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ href, prefetch = true, ...props }, ref) {
    return (
      <Link href={href} prefetch={prefetch} className="no-underline">
        <Button {...props} ref={ref} />
      </Link>
    );
  }
);
