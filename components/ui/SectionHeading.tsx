import { type ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={className}
      style={{
        fontSize: "20px",
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: "16px",
        borderBottom: "2px solid #eaeaea",
        paddingBottom: "8px",
      }}
    >
      {children}
    </h2>
  );
}
