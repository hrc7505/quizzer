import { makeStyles } from "@fluentui/react-components";

export const useBreadcrumbsStyles = makeStyles({
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
