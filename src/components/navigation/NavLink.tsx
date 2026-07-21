"use client";

import Link from "next/link";

import { cn } from "@/utils/cn";

import type { NavItem } from "@/components/navigation/nav-items";

interface NavLinkProps {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  /** Indent level: 0 = top item, 1 = nested (taxonomy). */
  indent?: boolean;
  /** Stagger animation delay in ms. */
  delay?: number;
}

export function NavLink({ item, pathname, onClose, indent = false, delay }: NavLinkProps) {
  const isActive = item.match
    ? pathname.startsWith(item.match)
    : pathname === item.href;

  return (
    <Link key={item.href} href={item.href} onClick={onClose}>
      <span
        className={cn(
          "flex items-center gap-3 rounded-lg font-medium transition-all duration-200 cursor-pointer animate-fade-in-up",
          indent ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm",
          isActive
            ? "bg-secondary text-foreground font-semibold"
            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        )}
        style={delay !== undefined ? { animationDelay: `${delay}ms`, animationFillMode: "both" } : undefined}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
    </Link>
  );
}
