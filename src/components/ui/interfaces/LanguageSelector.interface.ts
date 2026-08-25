/**
 * Interfaces for LanguageSelector component.
 */

export interface LanguageSelectorProps {
  /** Optional custom container CSS classes */
  className?: string;
  /** Visual variant: dropdown in header, compact pill, or flat segmented */
  variant?: "dropdown" | "compact" | "segmented";
  /** Whether to show flag emojis */
  showFlags?: boolean;
}
