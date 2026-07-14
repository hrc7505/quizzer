"use client";

import { FluentProvider as UIProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useSyncExternalStore } from "react";
import { SessionProvider } from "next-auth/react";

const emptySubscribe = () => () => {};

export function Providers({ children }: { children: React.ReactNode }) {
  // False during SSR and the initial client render (matches server HTML),
  // true after hydration — avoids a visibility hydration mismatch.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Resolve the preferred color scheme on the client only. Server and initial
  // client render both use the light theme, then this syncs to the real value
  // without a setState-in-effect.
  const isDark = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
      matchMedia.addEventListener("change", onChange);
      return () => matchMedia.removeEventListener("change", onChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    () => false
  );

  return (
    <SessionProvider>
      <UIProvider theme={isDark ? webDarkTheme : webLightTheme}>
        <div className="providers-shell" data-mounted={mounted ? "true" : undefined}>{children}</div>
      </UIProvider>
    </SessionProvider>
  );
}
