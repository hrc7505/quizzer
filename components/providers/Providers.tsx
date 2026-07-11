"use client";

import { FluentProvider as UIProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simple dark mode detection
    if (typeof window !== 'undefined') {
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(matchMedia.matches);
      
      const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
      matchMedia.addEventListener('change', listener);
      return () => matchMedia.removeEventListener('change', listener);
    }
  }, []);

  return (
    <SessionProvider>
      {!mounted ? (
        <div style={{ visibility: "hidden" }}>{children}</div>
      ) : (
        <UIProvider theme={isDark ? webDarkTheme : webLightTheme} style={{ height: "100vh", backgroundColor: isDark ? "#000" : "#f5f5f5" }}>
          {children}
        </UIProvider>
      )}
    </SessionProvider>
  );
}
