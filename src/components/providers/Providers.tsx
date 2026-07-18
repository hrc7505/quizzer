"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { OverlayProvider } from "@/components/providers/OverlayProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <OverlayProvider>{children}</OverlayProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
