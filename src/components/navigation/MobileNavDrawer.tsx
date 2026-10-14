"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { X, UserCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { publicNavLinks } from "@/components/navigation/nav-items";
import { NavLink } from "@/components/navigation/NavLink";

interface MobileNavDrawerProps {
  pathname: string;
  onClose: () => void;
}

/**
 * Mobile navigation drawer providing touch-friendly access to all public pages and user profile.
 */
export function MobileNavDrawer({ pathname, onClose }: MobileNavDrawerProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Image src="/quizzer.svg" alt="Quizzer Logo" width={71} height={24} priority className="dark:invert" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main navigation links */}
      <div className="flex flex-col gap-1.5">
        {publicNavLinks.map((link, idx) => (
          <NavLink key={link.href} item={link} pathname={pathname} onClose={onClose} delay={idx * 50} />
        ))}
      </div>

      {/* User profile / Auth section */}
      <div className="pt-4 border-t border-border/70 flex flex-col gap-2">
        {user ? (
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg bg-surface/50 hover:bg-surface-hover transition-colors no-underline text-foreground"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
              {user.name?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-foreground">
                {user.name || "Student"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                View Profile & Recorded Data
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/auth/login" onClick={onClose} className="no-underline">
            <Button variant="primary" className="w-full justify-center gap-2 text-xs font-semibold">
              <LogIn className="h-4 w-4" />
              <span>Sign In to Quizzer</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
