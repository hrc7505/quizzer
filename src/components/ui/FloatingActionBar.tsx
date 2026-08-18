"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { soundEffects } from "@/lib/services/sound-effects.service";
import { cn } from "@/utils/cn";
import type { FloatingActionBarProps } from "./interfaces/FloatingActionBar.interface";

/**
 * FloatingActionBar is a modern, mobile-responsive bottom action bar
 * for multi-selection workflows (batch operations, bulk actions, merge, delete, etc.).
 *
 * Automatically adapts:
 * - Mobile (< 640px): 2-tier stacked layout with touch-friendly action buttons.
 * - Desktop (>= 640px): Sleek, centered glassmorphic toolbar with spring animations.
 */
export function FloatingActionBar({
  isOpen,
  count,
  countLabel = "Selected",
  subtitle,
  onClear,
  clearLabel = "Clear",
  children,
  className,
  wrapperClassName,
  badgeVariant = "info",
}: FloatingActionBarProps) {
  const handleClear = () => {
    soundEffects.playClearSound();
    onClear?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{
            type: "spring",
            damping: 24,
            stiffness: 420,
            mass: 0.8,
          }}
          className={cn(
            "fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none select-none",
            wrapperClassName
          )}
        >
          <div
            className={cn(
              "pointer-events-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 sm:px-4 sm:py-3 max-w-2xl w-full justify-between animate-in",
              className
            )}
          >
            {/* Left Header / Count Section */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <motion.div
                  key={count}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  <Badge variant={badgeVariant} className="px-2.5 py-1 text-xs font-bold shadow-xs">
                    {count} {countLabel}
                  </Badge>
                </motion.div>

                {subtitle && (
                  <span className="text-xs text-muted-foreground font-medium hidden md:inline">
                    {subtitle}
                  </span>
                )}
              </div>

              {/* Mobile quick-clear button */}
              {onClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="sm:hidden h-7 w-7 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                  title={clearLabel}
                  aria-label={clearLabel}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Actions & Desktop Clear Section */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
              {children}

              {/* Desktop Clear button */}
              {onClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hidden sm:flex h-8.5 w-8.5 rounded-lg border border-border/80 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer shrink-0 ml-0.5"
                  title={clearLabel}
                  aria-label={clearLabel}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingActionBar;
