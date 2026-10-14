"use client";

import { type ReactNode } from "react";

import NavBar from "@/components/navigation/NavBar";
import Footer from "@/components/navigation/Footer";
import { Container, CONTAINER_MAX_WIDTH } from "@/components/layouts/Container";
import { cn } from "@/utils/cn";

type PageLayoutVariant = "public" | "admin" | "deep-dives" | "deep-dives-detail";

interface PageLayoutProps {
  children: ReactNode;
  variant?: PageLayoutVariant;
  navMaxWidth?: string;
  mainMaxWidth?: string;
  /** Wrap children in the standard Container. Set false for pages that
   *  manage their own full-bleed + Container layout (e.g. the home page). */
  contained?: boolean;
  className?: string;
  /** Whether to render the global Footer. Defaults to true for public non-scroll variants. */
  showFooter?: boolean;
}

/**
 * Standard page wrapper handling sticky navigation, scroll containment,
 * responsive gutters, and optional global footer.
 */
export function PageLayout({ 
  children, 
  variant = "public", 
  navMaxWidth = CONTAINER_MAX_WIDTH,
  mainMaxWidth = CONTAINER_MAX_WIDTH,
  contained = true,
  className,
  showFooter,
}: PageLayoutProps) {
  
  const isScrollContainer = variant === "admin" || variant === "deep-dives";
  const shouldRenderFooter = showFooter !== undefined ? showFooter : (variant === "public" && !isScrollContainer);

  return (
    <div 
      className={cn(
        "flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200",
        isScrollContainer && "h-screen overflow-hidden",
        className
      )}
    >
      <NavBar maxWidth={navMaxWidth} />
      {contained ? (
        <Container
          as="main"
          maxWidth={mainMaxWidth}
          className={cn(
            "flex-1 py-6 sm:py-8",
            isScrollContainer && "overflow-y-auto"
          )}
        >
          {children}
        </Container>
      ) : (
        <main className={cn("flex-1", isScrollContainer && "overflow-y-auto")}>
          {children}
        </main>
      )}
      {shouldRenderFooter && <Footer maxWidth={navMaxWidth} />}
    </div>
  );
}
