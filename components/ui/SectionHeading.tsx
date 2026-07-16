"use client";

import { type ReactNode } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  heading: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: "16px",
    borderBottom: "2px solid #eaeaea",
    paddingBottom: "8px",
  },
});

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  const styles = useStyles();
  return (
    <h2
      className={`${styles.heading} ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}
