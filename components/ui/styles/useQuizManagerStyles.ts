import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI styles for the QuizManager component.
 */
export const useQuizManagerStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    fontFamily: "Segoe UI, sans-serif",
  },
  linkButtonTitle: {
    padding: 0,
    height: "auto",
    fontWeight: "bold",
    color: "#0078d4",
    textAlign: "left",
    justifyContent: "flex-start",
    minWidth: "auto",
  },
  topicsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  topicsUnlinkedText: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  topicBadge: {
    borderRadius: "6px",
    height: "auto",
    minHeight: "20px",
    paddingTop: "2px",
    paddingBottom: "2px",
    lineHeight: "1.3",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  statsWrap: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  statOrderText: {
    color: "#374151",
  },
  statCountsText: {
    color: "#6b7280",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  titleText: {
    color: "#242424",
    display: "block",
  },
  titleBadge: {
    marginLeft: "10px",
    borderRadius: "12px",
  },
  subtitleText: {
    color: "#6b7280",
    marginTop: "4px",
    display: "block",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  filterPopover: {
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  emptyStateWrap: {
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
  emptyStateTitle: {
    color: "#374151",
  },
  emptyStateSubtitle: {
    color: "#6b7280",
  },
  tableCard: {
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
    padding: 0,
  },
  tableScrollWrap: {
    overflowX: "auto",
  },
  dataGrid: {
    minWidth: "820px",
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
  paginationShowWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  paginationLabel: {
    color: "#6b7280",
  },
  paginationSelect: {
    width: "80px",
  },
  paginationRange: {
    color: "#6b7280",
  },
  paginationButtons: {
    display: "flex",
    gap: "8px",
  },
  dialogSurfaceSm: {
    borderRadius: "12px",
    padding: "24px",
  },
  dialogSurfaceMd: {
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
  dialogSurfaceConfirm: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  dialogTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dialogContentGap: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    paddingTop: "16px",
  },
  dialogContentSmGap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
  },
  dialogContentConfirm: {
    paddingTop: "12px",
  },
  fullWidthInput: {
    width: "100%",
  },
  fullWidthTextarea: {
    width: "100%",
    minHeight: "80px",
  },
  dialogActions: {
    marginTop: "24px",
  },
  linkHelperText: {
    color: "#6b7280",
  },
  drawer: {
    width: "800px",
    maxWidth: "100%",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
  },
  drawerHeader: {
    borderBottom: "1px solid #eaeaea",
    padding: "16px 24px",
  },
  drawerTitleColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  drawerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  drawerQuizTitle: {
    color: "#242424",
  },
  drawerSubtitle: {
    color: "#6b7280",
  },
  drawerBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  drawerButtonRow: {
    display: "flex",
    gap: "10px",
  },
  drawerDeleteButton: {
    color: "#d13438",
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  sectionTitle: {
    color: "#242424",
  },
  topicCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  topicCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: "1px solid #f0f0f0",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  topicCardRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  topicUnlinkButton: {
    color: "#d13438",
  },
  emptyTopicsBox: {
    padding: "32px",
    textAlign: "center",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px dashed #d9d9d9",
  },
  emptyQuestionsBox: {
    padding: "32px",
    textAlign: "center",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px dashed #d9d9d9",
  },
  emptyBoxText: {
    color: "#9ca3af",
  },
  divider: {
    border: "0",
    borderTop: "1px solid #eaeaea",
    margin: "12px 0",
  },
  questionsCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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
  questionCardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },
  questionText: {
    color: "#1f2937",
    lineHeight: "1.4",
  },
  questionButtonRow: {
    display: "flex",
    gap: "4px",
  },
  questionDeleteButton: {
    color: "#d13438",
  },
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingLeft: "12px",
    borderLeft: "2px solid #e5e7eb",
  },
  optionCorrect: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  optionIncorrect: {
    color: "#4b5563",
    fontWeight: "normal",
  },
  hintText: {
    color: "#6b7280",
    fontStyle: "italic",
  },
  explanationText: {
    color: "#6b7280",
  },
  loadingWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "20px",
  },
  optionsGrid2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  iconColorPrimary: {
    color: "#0078d4",
  },
  iconColorWhite: {
    color: "white",
  },
  iconColorDanger: {
    color: "#d13438",
  },
  iconMedium: {
    fontSize: "16px",
  },
  linkDialogSurface: {
    borderRadius: "12px",
    padding: "24px",
  },
  linkDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    paddingTop: "16px",
  },
  linkDialogActions: {
    marginTop: "24px",
  },
  questionDialogSurface: {
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "600px",
    width: "100%",
  },
  questionDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
  },
  questionDialogActions: {
    marginTop: "24px",
  },
  confirmSurface: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  confirmContent: {
    paddingTop: "12px",
  },
  confirmBodyText: {
    color: "#616161",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  confirmButton: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#fff",
  },
  questionOptionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingLeft: "12px",
    borderLeft: "2px solid #e5e7eb",
  },
});
