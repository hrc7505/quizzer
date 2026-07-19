"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, ChevronRight } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Array of items to render in the breadcrumb trail. */
  items: BreadcrumbItem[];
}

const GAP = 6; // must match the flex `gap` on the container
const MENU_BUTTON_ESTIMATE = 32; // approximate width of the ellipsis button (w-8)

/**
 * Breadcrumbs component for nested directory navigation.
 * Stays on a single line. The first and last items are always visible; as the
 * available width shrinks, the middle items collapse (in order) into an ellipsis
 * overflow menu shown on the left, right after the first item.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
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
      <span className="text-foreground font-semibold truncate max-w-200px">{item.label}</span>
    ) : item.href ? (
      <Link href={item.href} className="text-muted-foreground hover:text-foreground font-medium hover:underline transition-colors duration-150 truncate max-w-150px">
        {item.label}
      </Link>
    ) : (
      <span className="text-muted-foreground font-medium truncate max-w-150px">{item.label}</span>
    );

    return (
      <span
        key={index}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
        className="inline-flex items-center gap-1.5"
      >
        {content}
        {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
      </span>
    );
  };

  return (
    <nav aria-label="Breadcrumb" className="w-full py-1">
      <div 
        ref={containerRef} 
        className="flex items-center flex-nowrap text-sm gap-1.5 overflow-hidden w-full select-none"
      >
        {n > 0 && renderItem(0, n === 1)}
        {showEcb && (
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-lg"
                  aria-label="Show more breadcrumb items"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownContent align="left" className="w-44">
                {overflowed.map((item, idx) => (
                  <DropdownItem
                    key={idx}
                    disabled={!item.href}
                    onClick={() => item.href && router.push(item.href)}
                  >
                    <span className="truncate w-full text-left">{item.label}</span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          </div>
        )}
        {Array.from({ length: Math.max(0, n - 1 - renderMiddleStart) }, (_, k) => renderItem(renderMiddleStart + k, false))}
        {n > 1 && renderItem(n - 1, true)}
      </div>
    </nav>
  );
}
