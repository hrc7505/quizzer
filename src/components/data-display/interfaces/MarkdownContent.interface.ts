/**
 * Interfaces for MarkdownContent component.
 */

export interface MarkdownContentProps {
  /** The markdown text string to render with formatting, KaTeX math, and step cards */
  content: string;
  /** Optional custom container CSS classes */
  className?: string;
}
