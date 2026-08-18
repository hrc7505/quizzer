/**
 * Interfaces for QuestionText component rendering formatted multi-statement questions.
 */

export interface FormattedStatement {
  /** The extracted label or bullet marker, e.g. "1.", "(i)", "Assertion (A)" */
  label: string;
  /** The body text of the statement */
  content: string;
  /** Original raw string of the statement */
  raw: string;
}

export interface ParsedQuestionData {
  /** The introductory premise or question statement */
  premise: string;
  /** Extracted sub-statements for multi-statement / assertion-reason questions */
  statements: FormattedStatement[];
  /** Trailing question prompt if present (e.g. "Which of the above is correct?") */
  prompt: string;
  /** Whether the question is recognized as a multi-statement question */
  isMultiStatement: boolean;
}

export interface QuestionTextProps {
  /** The raw question text string to render */
  text: string;
  /** Optional index number to prepend to the question */
  index?: number;
  /** Optional custom container CSS classes */
  className?: string;
  /** Optional custom typography size variant */
  size?: "sm" | "base" | "lg";
  /** Optional flag indicating if question is in an accordion header or compact view */
  isCompact?: boolean;
}
