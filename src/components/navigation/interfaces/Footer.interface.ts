import type { ReactNode } from "react";

/**
 * Interface representing a link in the footer navigation.
 */
export interface FooterLinkItem {
  /** Display label for the link */
  label: string;
  /** Target URL destination */
  href: string;
  /** Optional icon to display next to the label */
  icon?: ReactNode;
  /** Optional badge text (e.g., 'New', 'Live') */
  badge?: string;
  /** Optional external link flag */
  isExternal?: boolean;
}

/**
 * Interface representing a section or category of links in the footer.
 */
export interface FooterLinkSection {
  /** Heading title for the section */
  title: string;
  /** List of links belonging to this section */
  links: FooterLinkItem[];
}

/**
 * Props for the Footer component.
 */
export interface FooterProps {
  /** Optional maximum width for the footer container */
  maxWidth?: string;
  /** Optional additional CSS class names */
  className?: string;
}
