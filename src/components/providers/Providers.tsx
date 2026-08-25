"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

import { OverlayProvider } from "@/components/providers/OverlayProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

// React 19 introduces a strict dev warning for inline <script> tags rendered by components.
// next-themes uses an inline script tag to prevent flash of unstyled theme (FOUC) on load.
// This filters out the false-positive warning in development.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

/**
 * Root providers wrapper for authentication, theme management, toast notifications,
 * multi-language context, and modal overlays.
 *
 * @param props.children The application component tree to wrap with context providers.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <ToastProvider>
            <OverlayProvider>{children}</OverlayProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
