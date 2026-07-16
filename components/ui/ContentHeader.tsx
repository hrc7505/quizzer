"use client";

import { makeStyles } from "@fluentui/react-components";
import type { ReactNode } from "react";

export type ContentHeaderVariant = "exam" | "topic" | "subtopic" | "quiz";

interface ContentHeaderProps {
  icon: ReactNode;
  variant?: ContentHeaderVariant;
  title: string;
  description?: string | null;
}

const GRADIENTS: Record<ContentHeaderVariant, string> = {
  exam: "linear-gradient(135deg, #0078d4 0%, #00bcf2 100%)",
  topic: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
  subtopic: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
  quiz: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
};

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "32px",
  },
  badge: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#242424",
    margin: 0,
  },
   titleWrap: {
     minWidth: 0,
   },
   description: {
     color: "#616161",
     fontSize: "14px",
     lineHeight: 1.5,
     margin: "6px 0 0 0",
   },
});

export function ContentHeader({ icon, variant = "exam", title, description }: ContentHeaderProps) {
  const styles = useStyles();
  const gradient = GRADIENTS[variant];

  return (
    <div className={styles.root}>
      <div className={styles.badge} style={{ background: gradient }}>
        {icon}
      </div>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </div>
  );
}
