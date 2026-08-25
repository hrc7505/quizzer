/**
 * Interfaces for AnswerCallout component.
 */

import * as React from "react";

export type AnswerCalloutVariant = "correct" | "incorrect" | "explanation" | "hint";

export interface AnswerCalloutProps {
  /** Callout visual intent variant */
  variant: AnswerCalloutVariant;
  /** Option text or string content */
  text?: string | null;
  /** Markdown formatted explanation or custom JSX children */
  children?: React.ReactNode;
  /** Custom title/label override */
  title?: string;
  /** Optional custom container CSS classes */
  className?: string;
}
