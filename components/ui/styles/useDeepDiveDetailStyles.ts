import { makeStyles, shorthands } from "@fluentui/react-components";

export const useDeepDiveDetailStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("28px"),
    fontFamily: "var(--font-winky)",
  },
  backButton: {
    color: "#667eea",
    width: "fit-content",
  },
  headerCard: {
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(102,126,234,0.08)",
    overflow: "hidden",
    padding: 0,
  },
  banner: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "24px 28px",
    display: "flex",
    alignItems: "flex-start",
    ...shorthands.gap("16px"),
  },
  bannerIconContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerIcon: {
    color: "white",
    fontSize: "24px",
  },
  bannerTitle: {
    color: "white",
    display: "block",
    lineHeight: "1.3",
  },
  metaRow: {
    padding: "16px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
    borderBottom: "1px solid #f3f4f6",
  },
  metaLeft: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    flexWrap: "wrap",
  },
  metaIcon: {
    color: "#667eea",
  },
  metaTopic: {
    color: "#374151",
  },
  correctAnswerRow: {
    padding: "12px 28px",
    background: "#f0fdf4",
    borderBottom: "1px solid #e5e7eb",
  },
  correctAnswerText: {
    color: "#15803d",
  },
  elaborationCard: {
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    padding: "32px",
  },
  markdownBody: {
    lineHeight: "1.7",
    color: "#1f2937",
  },
  emptyCard: {
    borderRadius: "16px",
    padding: "48px",
    textAlign: "center",
    border: "1px dashed #d1d5db",
  },
  metaSeparator: {
    color: "#9ca3af",
  },
  emptyText: {
    color: "#9ca3af",
  },
});
