import type { ReactNode } from "react";

/**
 * Feature highlight item displayed on the About page.
 */
export interface AboutFeatureItem {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
}

/**
 * Milestone or platform capability item.
 */
export interface AboutPillarItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
}
