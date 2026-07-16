import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Griffel (Fluent UI) styles for the TaxonomyManager component.
 * All inline styles previously used in TaxonomyManager.tsx are migrated here.
 */
export const useTaxonomyManagerStyles = makeStyles({
  // ── Root & Loading ──────────────────────────────────────────────
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "300px",
  },

  // ── Exams/Topic DataGrid Columns (renderCell content) ──────────
  examTitleButton: {
    padding: 0,
    height: "auto",
    fontWeight: "bold",
    color: "#0078d4",
    textAlign: "left",
    justifyContent: "flex-start",
    minWidth: "auto",
  },
  topicTitleButton: {
    padding: 0,
    height: "auto",
    fontWeight: "semibold",
    color: "#0078d4",
    textAlign: "left",
    justifyContent: "flex-start",
    minWidth: "auto",
  },
  cellDescriptionText: {
    color: "#616161",
    fontSize: "13px",
  },
  cellDescriptionFallback: {
    fontStyle: "italic",
    color: "#b3b3b3",
  },
  topicsCountContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  bookOpenIcon: {
    color: "#0078d4",
  },
  displayTypeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  chevronIcon: {
    color: "#a19f9d",
  },
  displayTypeText: {
    fontSize: "13px",
    color: "#616161",
  },
  statsContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  documentDatabaseIcon: {
    color: "#107c41",
  },

  // ── View Header (shared for exams & topics) ────────────────────
  viewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewTitleText: {
    color: "#242424",
  },
  viewSubtitleText: {
    color: "#616161",
    marginTop: "4px",
  },
  viewHeaderActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  filterPopover: {
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  // ── Empty States (shared) ──────────────────────────────────────
  emptyStateWrapper: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    padding: "40px 0",
  },
  emptyStateCard: {
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    maxWidth: "550px",
    width: "100%",
  },
  emptyStateIcon: {
    color: "#0078d4",
  },
  emptyStateTextContainer: {
    textAlign: "center",
  },
  emptyStateTitleText: {
    color: "#242424",
    marginBottom: "6px",
  },
  emptyStateSubtitleText: {
    color: "#616161",
  },

  // ── DataGrid Cards & Pagination (shared) ───────────────────────
  dataGridCard: {
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    padding: 0,
  },
  scrollContainer: {
    overflowX: "auto",
    width: "100%",
  },
  examDataGrid: {
    minWidth: "800px",
  },
  topicDataGrid: {
    minWidth: "900px",
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
    borderBottom: "1px solid #f0f0f0",
    transition: "background 0.2s",
  },
  dataGridCell: {
    padding: "16px",
  },
  paginationFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderTop: "1px solid #eaeaea",
    backgroundColor: "#fafafa",
    flexWrap: "wrap",
    gap: "12px",
  },
  pageSizeSelector: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  paginationLabel: {
    color: "#616161",
  },
  fullWidthSelect: {
    width: "80px",
  },
  paginationNav: {
    display: "flex",
    gap: "8px",
  },

  // ── Dialogs (shared surfaces) ───────────────────────────────────
  dialogSurface: {
    borderRadius: "12px",
    padding: "24px",
  },
  dialogSurfaceMax400: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "400px",
  },
  dialogSurfaceQuizAI: {
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "640px",
    width: "100%",
  },
  dialogSurfaceQuestion: {
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "600px",
    width: "100%",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    paddingTop: "16px",
  },
  dialogContentSmallGap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
  },
  dialogContentPadTop: {
    paddingTop: "16px",
  },
  dialogContentConfirm: {
    paddingTop: "12px",
  },
  dialogActions: {
    marginTop: "24px",
  },
  fullWidthInput: {
    width: "100%",
  },
  fullWidthTextarea: {
    width: "100%",
    minHeight: "80px",
  },
  fullWidthCombobox: {
    width: "100%",
  },

  // ── Generate Quiz with AI Dialog ────────────────────────────────
  quizAIDialogTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sparkleIcon: {
    color: "#0078d4",
  },

  // ── Confirmation Dialog ────────────────────────────────────────
  confirmDescriptionText: {
    color: "#616161",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  confirmButtonDestructive: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#ffffff",
  },

  // ── Drawers (shared surfaces) ───────────────────────────────────
  overlayDrawer: {
    width: "800px",
    maxWidth: "100%",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
  },
  overlayDrawerQuiz: {
    width: "800px",
    maxWidth: "100%",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
  },
  drawerHeader: {
    borderBottom: "1px solid #eaeaea",
    padding: "16px 24px",
  },
  drawerBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  drawerHeaderContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  drawerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  drawerTitleText: {
    color: "#242424",
  },
  drawerDescriptionText: {
    color: "#616161",
    fontWeight: "normal",
    lineHeight: "1.4",
  },
  drawerDescriptionFallback: {
    fontStyle: "italic",
    color: "#b3b3b3",
  },

  // ── Section Headers (shared) ────────────────────────────────────
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionHeaderWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "8px",
  },
  sectionHeaderTitle: {
    color: "#242424",
  },
  sectionHeaderQuestions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  // ── Linked item lists (topics, subtopics, quizzes, questions) ───
  linkedList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  linkedItemCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: "1px solid #f0f0f0",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  linkedItemTextContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  linkedItemTitle: {
    color: "#242424",
  },
  unlinkButton: {
    color: "#d13438",
  },
  deleteButton: {
    color: "#d13438",
  },
  quizUnlinkButton: {
    color: "#616161",
  },

  // ── Empty state (dashed) ───────────────────────────────────────
  dashedEmptyState: {
    padding: "32px",
    textAlign: "center",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px dashed #d9d9d9",
  },
  dashedEmptyStateText: {
    color: "#a19f9d",
  },
  dashedEmptyStateTextAlt: {
    color: "#9ca3af",
  },

  // ── Linked quizzes section specific ─────────────────────────────
  quizzesActionButtons: {
    display: "flex",
    gap: "8px",
  },
  quizLinkButton: {
    padding: 0,
    height: "auto",
    fontWeight: "bold",
    color: "#0078d4",
    textAlign: "left",
    justifyContent: "flex-start",
    minWidth: "auto",
  },
  quizMetaText: {
    color: "#616161",
  },
  quizActionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // ── Quiz Detail Drawer (questions) ──────────────────────────────
  quizOrderText: {
    color: "#6b7280",
  },
  questionsLoading: {
    display: "flex",
    justifyContent: "center",
    padding: "20px",
  },
  questionCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    border: "1px solid #f0f0f0",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  questionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  questionText: {
    color: "#1f2937",
    lineHeight: "1.4",
  },
  questionActionButtons: {
    display: "flex",
    gap: "4px",
  },
  optionList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingLeft: "12px",
    borderLeft: "2px solid #e5e7eb",
  },
  optionText: {
    color: "#4b5563",
    fontWeight: "normal",
  },
  optionTextCorrect: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  hintText: {
    color: "#6b7280",
    fontStyle: "italic",
  },
  explanationText: {
    color: "#6b7280",
  },

  // ── Question Dialog ─────────────────────────────────────────────
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
});
