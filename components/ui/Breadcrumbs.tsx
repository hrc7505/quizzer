"use client";

import Link from "next/link";
import { Text } from "@fluentui/react-components";
import { ChevronRight16Regular } from "@fluentui/react-icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Array of items to render in the breadcrumb trail. */
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs component for nested directory navigation.
 * Renders a clean list of clickable path links separated by chevron icons.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "28px" }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {isLast ? (
              <Text size={200} weight="semibold" style={{ color: "#0f172a" }}>
                {item.label}
              </Text>
            ) : item.href ? (
              <Link href={item.href} style={{ textDecoration: "none" }}>
                <Text size={200} style={{ color: "#0078d4", cursor: "pointer" }}>
                  {item.label}
                </Text>
              </Link>
            ) : (
              <Text size={200} style={{ color: "#64748b" }}>
                {item.label}
              </Text>
            )}

            {!isLast && (
              <ChevronRight16Regular style={{ color: "#cbd5e1", fontSize: "14px" }} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
