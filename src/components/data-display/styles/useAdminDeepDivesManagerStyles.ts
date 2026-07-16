import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI (Griffel) styles for the AdminDeepDivesManager component.
 */
export const useAdminDeepDivesManagerStyles = makeStyles({
  /* Page root */
  pageRoot: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },

  /* Header */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIconContainer: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    color: "white",
    fontSize: "24px",
  },
  headerTitle: {
    color: "#1a1a2e",
    display: "block",
  },
  headerCountBadge: {
    marginLeft: "10px",
    borderRadius: "12px",
  },
  headerSubtitle: {
    color: "#6b7280",
  },
  headerRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  popoverSurface: {
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  bulkDeleteButton: {
    color: "#d13438",
    ...shorthands.borderColor("#d13438"),
  },

  /* Table columns */
  questionCell: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    color: "#1f2937",
    lineHeight: "1.4",
  },
  topicCell: {
    color: "#6b7280",
  },
  quizCellColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  quizTitle: {
    color: "#374151",
  },
  quizBadge: {
    width: "fit-content",
  },
  quizUnlinked: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  actionsCell: {
    display: "flex",
    gap: "6px",
  },
  deleteActionButton: {
    color: "#d13438",
  },

  /* Empty state */
  emptyStateWrapper: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 0",
  },
  emptyStateCard: {
    borderRadius: "16px",
    padding: "48px",
    textAlign: "center",
    border: "1px dashed #d1d5db",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    maxWidth: "520px",
    width: "100%",
  },
  emptyStateIcon: {
    color: "#667eea",
  },
  emptyStateTitle: {
    color: "#374151",
  },
  emptyStateText: {
    color: "#6b7280",
  },

  /* Data grid card */
  tableCard: {
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
    padding: 0,
  },
  tableScroll: {
    overflowX: "auto",
  },
  dataGrid: {
    minWidth: "800px",
  },
  dataGridHeader: {
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #eaeaea",
  },
  dataGridHeaderCell: {
    padding: "12px 16px",
    fontWeight: "bold",
  },
  dataGridRow: {
    borderBottom: "1px solid #f5f5f5",
  },
  dataGridCell: {
    padding: "14px 16px",
  },

  /* Pagination footer */
  paginationFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderTop: "1px solid #eaeaea",
    backgroundColor: "#fafafa",
    flexWrap: "wrap",
    gap: "10px",
  },
  paginationLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageSizeSelect: {
    width: "80px",
  },
  paginationLabel: {
    color: "#6b7280",
  },
  paginationRange: {
    color: "#6b7280",
  },
  paginationButtons: {
    display: "flex",
    gap: "8px",
  },

  /* Confirmation dialog */
  dialogSurface: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  dialogContent: {
    paddingTop: "12px",
  },
  dialogText: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  dialogActions: {
    marginTop: "24px",
  },
  dialogConfirmButton: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#fff",
  },
});
