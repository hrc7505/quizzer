"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuList, MenuPopover, MenuTrigger, Button, MenuItem } from "@fluentui/react-components";
import { MoreHorizontalRegular, ChevronRight16Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { useBreadcrumbsStyles } from "./styles/useBreadcrumbsStyles";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Array of items to render in the breadcrumb trail. */
  items: BreadcrumbItem[];
}

const GAP = 6; // must match the flex `gap` on the container
const MENU_BUTTON_ESTIMATE = 44; // approximate width of the ellipsis (ECB) button

/**
 * Breadcrumbs component for nested directory navigation.
 * Stays on a single line. The first and last items are always visible; as the
 * available width shrinks, the middle items collapse (in order) into an ellipsis
 * (ECB) overflow menu shown on the left, right after the first item.
 * Uses Fluent UI's Menu/Button for the overflow control.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const styles = useBreadcrumbsStyles();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const widthsCache = useRef<number[]>([]);
  const [middleVisible, setMiddleVisible] = useState(Math.max(0, items.length - 2));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const available = container.clientWidth;

      for (let i = 0; i < items.length; i++) {
        const el = itemRefs.current[i];
        if (el && el.offsetWidth > 0) {
          widthsCache.current[i] = el.offsetWidth;
        }
      }
      const w = widthsCache.current;
      const n = items.length;

      if (n <= 2) {
        setMiddleVisible(Math.max(0, n - 2));
        return;
      }

      const firstW = w[0] ?? 0;
      const lastW = w[n - 1] ?? 0;

      let used = firstW + lastW + GAP;
      let allFit = true;
      for (let i = 1; i < n - 1; i++) {
        used += GAP + (w[i] ?? 0);
        if (used > available) {
          allFit = false;
          break;
        }
      }
      if (allFit) {
        setMiddleVisible(n - 2);
        return;
      }

      used = firstW + lastW + GAP + (MENU_BUTTON_ESTIMATE + GAP);
      let count = 0;
      for (let i = n - 2; i >= 1; i--) {
        const add = GAP + (w[i] ?? 0);
        if (used + add > available) {
          break;
        }
        used += add;
        count++;
      }
      setMiddleVisible(count);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items.length]);

  const n = items.length;
  const overflowed = items.slice(1, n - 1 - middleVisible);
  const showEcb = overflowed.length > 0 && n > 2;
  const renderMiddleStart = Math.max(1, n - 1 - middleVisible);

  const renderItem = (index: number, isLast: boolean) => {
    const item = items[index];
    if (!item) return null;
    const content = isLast ? (
      <span style={{ fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{item.label}</span>
    ) : item.href ? (
      <Link href={item.href} className={styles.link} style={{ whiteSpace: "nowrap" }}>
        {item.label}
      </Link>
    ) : (
      <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{item.label}</span>
    );

    return (
      <span
        key={index}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
        className={styles.item}
      >
        {content}
        {!isLast && <ChevronRight16Regular className={styles.chevron} />}
      </span>
    );
  };

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "28px", overflow: "hidden" }}>
      <div ref={containerRef} className={styles.container}>
        {n > 0 && renderItem(0, n === 1)}
        {showEcb && (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                size="small"
                icon={<MoreHorizontalRegular />}
                aria-label="Show more breadcrumb items"
                className={styles.overflowButton}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {overflowed.map((item, idx) => (
                  <MenuItem
                    key={idx}
                    disabled={!item.href}
                    onClick={() => item.href && router.push(item.href)}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
        {Array.from({ length: Math.max(0, n - 1 - renderMiddleStart) }, (_, k) => renderItem(renderMiddleStart + k, false))}
        {n > 1 && renderItem(n - 1, true)}
      </div>
    </nav>
  );
}
