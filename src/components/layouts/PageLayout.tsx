"use client";

import { type ReactNode } from "react";
import NavBar from "@/components/navigation/NavBar";
import { cn } from "@/utils/cn";

type PageLayoutVariant = "public" | "admin" | "deep-dives" | "deep-dives-detail";

interface PageLayoutProps {
  children: ReactNode;
  variant?: PageLayoutVariant;
  navMaxWidth?: string;
  mainMaxWidth?: string;
  className?: string;
}

export function PageLayout({ 
  children, 
  variant = "public", 
  navMaxWidth, 
  mainMaxWidth, 
  className 
}: PageLayoutProps) {
  
  const isScrollContainer = variant === "admin" || variant === "deep-dives";

  return (
    <div 
      className={cn(
        "flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200",
        isScrollContainer && "h-screen overflow-hidden",
        className
      )}
    >
      <NavBar maxWidth={navMaxWidth} />
      <main 
        className={cn(
          "w-full px-4 py-6 sm:px-6 lg:px-8 mx-auto flex-1",
          isScrollContainer && "overflow-y-auto",
          variant === "deep-dives-detail" && !mainMaxWidth ? "max-w-4xl" : "max-w-7xl"
        )}
        style={mainMaxWidth ? { maxWidth: mainMaxWidth } : undefined}
      >
        {children}
      </main>
    </div>
  );
}
