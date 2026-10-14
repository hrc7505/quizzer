import * as React from "react";

/**
 * Type of resource recommendation or sponsor card.
 */
export type SponsoredResourceType = "course" | "book" | "certification" | "tool" | "support";

/**
 * Single recommendation item.
 */
export interface SponsoredResourceItem {
  /** Unique ID of the resource */
  id: string;
  /** Title of the resource / course / book */
  title: string;
  /** Short punchy description */
  description: string;
  /** Affiliate or external destination URL */
  url: string;
  /** Badge tag e.g. "Official Guide", "Practice Exam", "Free Book" */
  badgeText?: string;
  /** Provider name e.g. "Coursera", "Udemy", "O'Reilly", "GitHub" */
  provider: string;
  /** Optional icon name or type */
  type: SponsoredResourceType;
  /** Keywords or topic tags this item matches (e.g. ['aws', 'cloud', 'react']) */
  tags?: string[];
  /** Optional discount / coupon text e.g. "Save 20%" */
  offerText?: string;
}

/**
 * Props for the ResourceRecommendationCard component.
 */
export interface ResourceRecommendationCardProps {
  /** Optional topic title or keywords to find contextual recommendations */
  contextTopic?: string;
  /** Specific items to display, bypassing auto-matching */
  customItems?: SponsoredResourceItem[];
  /** Card header title */
  title?: string;
  /** Card header subtitle */
  subtitle?: string;
  /** Maximum number of resource items to display (defaults to 2) */
  maxItems?: number;
  /** Whether to show a non-intrusive sponsor disclaimer */
  showDisclaimer?: boolean;
  /** Custom CSS class for outer container */
  className?: string;
}

