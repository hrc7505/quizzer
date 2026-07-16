import { makeStyles } from "@fluentui/react-components";

export const useBreadcrumbsStyles = makeStyles({
  nav: {
    marginBottom: "28px",
    overflow: "hidden",
  },
  container: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },
  item: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  currentItem: {
    fontWeight: 600,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  link: {
    textDecoration: "none",
    color: "#0078d4",
    whiteSpace: "nowrap",
  },
  chevron: {
    color: "#cbd5e1",
    fontSize: "14px",
  },
  overflowButton: {
    flexShrink: 0,
  },
});
