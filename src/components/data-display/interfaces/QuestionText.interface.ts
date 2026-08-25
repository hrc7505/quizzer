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

export interface MatchingColumn {
  /** Title of the column, e.g. "List I", "List II", "Column A" */
  title?: string;
  /** Items within this column */
  items: FormattedStatement[];
}

export interface ParsedQuestionData {
  /** The introductory premise or question statement */
  premise: string;
  /** Extracted sub-statements for multi-statement / assertion-reason questions */
  statements: FormattedStatement[];
  /** Matching columns for 'Match the following' / pair relation questions */
  matchingColumns?: {
    left: MatchingColumn;
    right: MatchingColumn;
  } | null;
  /** Trailing question prompt if present (e.g. "Which of the above is correct?") */
  prompt: string;
  /** Whether the question is recognized as a multi-statement question */
  isMultiStatement: boolean;
  /** Whether the question is a pair matching question */
  isMatching: boolean;
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
