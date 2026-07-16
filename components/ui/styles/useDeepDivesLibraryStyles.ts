import { makeStyles, shorthands } from "@fluentui/react-components";

export const useDeepDivesLibraryStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("32px"),
  },
  headerWrap: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
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
  headerSubtitle: {
    color: "#6b7280",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    background: "white",
    borderRadius: "12px",
    padding: "16px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  searchIcon: {
    color: "#9ca3af",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 32px",
    background: "white",
    borderRadius: "16px",
    border: "1px dashed #d1d5db",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#9ca3af",
    marginBottom: "16px",
  },
  emptyTitle: {
    color: "#374151",
    marginBottom: "8px",
  },
  emptyText: {
    color: "#6b7280",
  },
  noResults: {
    textAlign: "center",
    padding: "48px",
    background: "white",
    borderRadius: "12px",
  },
  groupWrap: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
  },
  groupTitle: {
    color: "#1f2937",
  },
  groupBadge: {
    borderRadius: "12px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    ...shorthands.gap("16px"),
  },
  cardLink: {
    textDecoration: "none",
  },
  card: {
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    padding: "20px",
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, border-color",
    transitionDuration: "0.2s",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      ...shorthands.borderColor("#667eea"),
    },
  },
  cardBadgeRow: {
    display: "flex",
    ...shorthands.gap("6px"),
    flexWrap: "wrap",
  },
  cardBadge: {
    borderRadius: "6px",
    fontSize: "11px",
    height: "auto",
    minHeight: "20px",
    paddingTop: "2px",
    paddingBottom: "2px",
    lineHeight: "1.3",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  questionText: {
    color: "#1f2937",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.5",
  },
  correctAnswerBlock: {
    marginTop: "auto",
    padding: "8px 12px",
    background: "#f0fdf4",
    borderRadius: "6px",
    borderLeft: "3px solid #22c55e",
  },
  correctAnswerText: {
    color: "#15803d",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ...shorthands.gap("12px"),
    paddingTop: "8px",
  },
  paginationText: {
    color: "#6b7280",
  },
});
