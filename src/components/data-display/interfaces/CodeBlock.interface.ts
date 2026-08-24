/**
 * Interface properties for the CodeBlock component.
 */
export interface CodeBlockProps {
  /** The raw source code string */
  code: string;
  /** Programming language identifier (e.g. 'c', 'python', 'javascript') */
  language?: string;
  /** Optional custom container CSS classes */
  className?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}
