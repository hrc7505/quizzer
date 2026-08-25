/**
 * Interfaces for QuestionImage component.
 */

export type QuestionImageViewVariant = "thumbnail" | "display" | "interactive";

export interface QuestionImageProps {
  /** Candidate image URL (raw or sanitized) */
  src?: string | null;
  /** Image alternative text */
  alt?: string;
  /** Whether to invert image colors in dark mode (default true) */
  invertInDark?: boolean;
  /** Visual display variant: thumbnail for cards, display for accordions, interactive for zoomable quiz taker */
  variant?: QuestionImageViewVariant;
  /** Custom outer container CSS classes */
  className?: string;
  /** Image loading strategy: lazy or eager */
  loading?: "lazy" | "eager";
}
