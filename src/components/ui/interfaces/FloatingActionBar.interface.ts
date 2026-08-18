import * as React from "react";

/**
 * Props for the reusable FloatingActionBar component.
 */
export interface FloatingActionBarProps {
  /** Whether the action bar is currently visible. Usually (count > 0). */
  isOpen: boolean;
  /** The count of selected items to highlight. */
  count: number;
  /** Label after the count number. Defaults to "Selected". */
  countLabel?: string;
  /** Optional secondary subtitle or description next to count on desktop. */
  subtitle?: string;
  /** Callback fired when user clicks the deselect / clear button. */
  onClear?: () => void;
  /** Label for the clear button. Defaults to "Clear". */
  clearLabel?: string;
  /** Action buttons and controls placed inside the bar. */
  children?: React.ReactNode;
  /** Additional custom classes for the inner container. */
  className?: string;
  /** Additional custom classes for the outer wrapper. */
  wrapperClassName?: string;
  /** Badge color variant. Defaults to "info". */
  badgeVariant?: "default" | "info" | "danger" | "warning" | "success" | "secondary" | "outline";
}
