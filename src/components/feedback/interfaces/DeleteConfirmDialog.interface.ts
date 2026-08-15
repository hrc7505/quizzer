/**
 * Interface definition for DeleteConfirmDialog component.
 */

export interface LinkSummaryItem {
  /** Label for the category of link (e.g., "Parent Topics", "Linked Exams", "Questions") */
  label: string;
  /** Value or list of linked items */
  items: string[] | number;
}

export interface DeleteConfirmDialogBodyProps {
  /** The title or name of the entity being deleted */
  title: string;
  /** Type of entity (e.g., "Exam", "Main Topic", "Sub Topic", "Quiz", "Question") */
  itemType: string;
  /** List of active links/associations to display */
  linkSummaries: LinkSummaryItem[];
  /** Warning message or explanation of what will be unlinked/deleted */
  consequenceMessage?: string;
}
