import { makeStyles, shorthands } from "@fluentui/react-components";

export const useAdminQuizQuestionsManagerStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    fontFamily: "Segoe UI, sans-serif",
  },
  backButton: {
    marginBottom: "12px",
  },
  breadcrumbsRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: "4px",
    display: "block",
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
  },
  questionsList: {
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
  questionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  questionText: {
    color: "#0f172a",
    lineHeight: "1.4",
    display: "block",
  },
  actionsRow: {
    display: "flex",
    gap: "6px",
  },
  deleteButton: {
    color: "#d13438",
  },
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
  optionCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  optionCircleCorrect: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  optionCircleDefault: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  optionLabel: {
    fontWeight: "normal",
    color: "#334155",
  },
  optionLabelCorrect: {
    color: "#15803d",
    fontWeight: "600",
  },
  extrasBox: {
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
  addEditDialogSurface: {
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "600px",
    width: "100%",
  },
  addEditDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
  },
  textareaFull: {
    width: "100%",
    minHeight: "80px",
  },
  optionsFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  inputFull: {
    width: "100%",
  },
  dialogActions: {
    marginTop: "24px",
  },
  confirmDialogSurface: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  confirmDialogContent: {
    paddingTop: "12px",
  },
  confirmText: {
    color: "#616161",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  confirmButtonDanger: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#fff",
  },
  breadcrumbMuted: {
    color: "#6b7280",
  },
  breadcrumbSeparator: {
    color: "#cbd5e1",
  },
  breadcrumbActive: {
    color: "#0f172a",
  },
  titlePrimary: {
    color: "#242424",
  },
  titleSecondary: {
    color: "#374151",
  },
  emptySubtitle: {
    color: "#6b7280",
    maxWidth: "460px",
  },
});
