/**
 * Interfaces for OptionText component.
 */

export interface OptionPairItem {
  /** The left side label or key, e.g. "a", "1", "A" */
  left: string;
  /** The right side value or target, e.g. "3", "i", "B" */
  right: string;
}

export interface OptionTextProps {
  /** The raw option text string to render */
  text: string;
  /** Optional custom container CSS classes */
  className?: string;
}
