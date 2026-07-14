import type { ReactNode } from "react";

interface ContentHeaderProps {
  /** Icon element rendered inside the colored badge (e.g. <BookOpen24Regular />). */
  icon: ReactNode;
  /** CSS background for the icon badge, typically a linear-gradient. */
  gradient: string;
  /** Heading text. */
  title: string;
  /** Optional supporting description shown beneath the title. */
  description?: string | null;
}

/**
 * Shared content header used across the public site (exam / topic / subtopic pages).
 * Renders an icon badge aligned to the top of the title, with an optional
 * description beneath. Uses `flex-start` alignment so the badge stays aligned
 * to the first line of the title even when the description wraps to multiple lines.
 */
export function ContentHeader({ icon, gradient, title, description }: ContentHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "32px" }}>
      <div
        style={{
          width: "44px",
          height: "44px",
          flexShrink: 0,
          borderRadius: "10px",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.2, color: "#242424", margin: 0 }}>
          {title}
        </h1>
        {description ? (
          <p style={{ color: "#616161", fontSize: "14px", lineHeight: 1.5, margin: "6px 0 0 0" }}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
