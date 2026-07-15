"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";

// @ts-expect-error - ssr: false in client component
const NavBar = dynamic(() => import("@/components/ui/NavBar"), { ssr: false }) as React.ComponentType<{ maxWidth?: string }>;

interface PageLayoutProps {
  children: ReactNode;
  variant?: PageLayoutVariant;
  navMaxWidth?: string;
  mainMaxWidth?: string;
  className?: string;
}

type PageLayoutVariant = "public" | "admin" | "deep-dives" | "deep-dives-detail";

const VARIANT_STYLES: Record<PageLayoutVariant, { wrapper: React.CSSProperties; main: React.CSSProperties }> = {
  public: {
    wrapper: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f9f9f9" },
    main: { padding: "24px 16px", maxWidth: "1200px", margin: "0 auto", width: "100%" },
  },
  admin: {
    wrapper: { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f9f9f9" },
    main: { flex: 1, overflowY: "auto", padding: "24px 16px", maxWidth: "1200px", margin: "0 auto", width: "100%" },
  },
  "deep-dives": {
    wrapper: { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#f0f2f5" },
    main: { flex: 1, overflowY: "auto", padding: "24px 16px", maxWidth: "1100px", margin: "0 auto", width: "100%" },
  },
  "deep-dives-detail": {
    wrapper: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f0f2f5" },
    main: { padding: "24px 16px", maxWidth: "900px", margin: "0 auto", width: "100%" },
  },
};

export function PageLayout({ children, variant = "public", navMaxWidth, mainMaxWidth, className }: PageLayoutProps) {
  const { wrapper, main } = VARIANT_STYLES[variant];

  return (
    <div style={wrapper} className={className}>
      <NavBar maxWidth={navMaxWidth} />
      <main style={{ ...main, maxWidth: mainMaxWidth ?? main.maxWidth }}>{children}</main>
    </div>
  );
}
