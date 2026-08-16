import type { ImgHTMLAttributes } from "react";

/**
 * Properties for the ShimmerImage component.
 */
export interface ShimmerImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Source URL or base64 data URI of the image */
  src?: string | null;
  /** Alt text for accessibility */
  alt?: string;
  /** Automatically inverts black & white circuit schematics in dark mode */
  invertInDark?: boolean;
  /** Optional CSS classes for the outer bounding wrapper */
  containerClassName?: string;
  /** CSS classes applied directly to the HTML img tag */
  className?: string;
  /** Optional click handler (e.g. for opening an enlargement lightbox) */
  onClick?: () => void;
  /** Optional custom fallback label if the image fails to load */
  fallbackText?: string;
}
