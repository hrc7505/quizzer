import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI styles for the AdminQuestionsManager component.
 */
export const useAdminQuestionsManagerStyles = makeStyles({
  // ── Root / layout ────────────────────────────────────────────────
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerTitle: {
    color: "#242424",
    display: "block",
  },
  headerBadge: {
    marginLeft: "10px",
    borderRadius: "12px",
  },
  headerSubtitle: {
    color: "#6b7280",
    marginTop: "4px",
    display: "block",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  // ── Filter popover ───────────────────────────────────────────────
  filterSurface: {
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // ── Empty state ──────────────────────────────────────────────────
  emptyWrapper: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 0",
  },
  emptyCard: {
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
  emptyIcon: {
    color: "#0078d4",
    fontSize: "48px",
  },
  emptyTitle: {
    color: "#374151",
  },
  emptyText: {
    color: "#6b7280",
  },

  // ── Question list ────────────────────────────────────────────────
  listWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  questionCard: {
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    padding: "24px",
  },
  questionCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  badgeRounded: {
    borderRadius: "6px",
    height: "auto",
    minHeight: "20px",
    paddingTop: "2px",
    paddingBottom: "2px",
    lineHeight: "1.3",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  questionText: {
    color: "#0f172a",
    lineHeight: "1.4",
    display: "block",
  },
  cardActions: {
    display: "flex",
    gap: "6px",
  },
  deleteButton: {
    color: "#d13438",
  },

  // ── Options grid ─────────────────────────────────────────────────
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    marginTop: "14px",
    paddingLeft: "12px",
    borderLeft: "3px solid #e2e8f0",
  },
  optionItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  optionBadge: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  optionBadgeCorrect: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  optionBadgeDefault: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  optionTextCorrect: {
    color: "#15803d",
    fontWeight: "600",
  },
  optionTextDefault: {
    color: "#334155",
    fontWeight: "normal",
  },

  // ── Hint / description block ─────────────────────────────────────
  metaBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  hintText: {
    color: "#64748b",
    fontStyle: "italic",
  },
  descriptionText: {
    color: "#64748b",
  },

  // ── Pagination footer ────────────────────────────────────────────
  paginationCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "white",
    flexWrap: "wrap",
    gap: "10px",
  },
  paginationLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  mutedText: {
    color: "#6b7280",
  },
  pageSizeSelect: {
    width: "80px",
  },
  paginationButtons: {
    display: "flex",
    gap: "8px",
  },

  // ── Dialogs ──────────────────────────────────────────────────────
  questionDialogSurface: {
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "600px",
    width: "100%",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
  },
  fullWidth: {
    width: "100%",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
  },
  optionsFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  dialogActions: {
    marginTop: "24px",
  },

  // ── Confirmation dialog ──────────────────────────────────────────
  confirmDialogSurface: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  confirmContent: {
    paddingTop: "12px",
  },
  confirmText: {
    color: "#616161",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  confirmButton: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#fff",
  },
});
