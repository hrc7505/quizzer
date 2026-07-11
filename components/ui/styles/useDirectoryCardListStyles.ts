import { makeStyles } from "@fluentui/react-components";

/**
 * Fluent UI styles for DirectoryCardList.
 */
export const useDirectoryCardListStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  searchBar: {
    backgroundColor: "white",
    padding: "14px 20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },

  searchIcon: {
    fontSize: "18px",
    color: "#64748b",
  },

  searchInput: {
    width: "100%",
    maxWidth: "360px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },

  link: {
    textDecoration: "none",
  },

  card: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    padding: "24px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },

  title: {
    color: "#0f172a",
    display: "block",
    marginBottom: "6px",
  },

  description: {
    color: "#64748b",
    lineHeight: "1.4",
    display: "block",
  },

  metaRow: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "12px",
  },

  metaBadge: {
    fontSize: "11px",
    color: "#4f46e5",
    fontWeight: "semibold",
    backgroundColor: "#e0e7ff",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  openRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#0078d4",
    fontSize: "13px",
    fontWeight: "bold",
  },

  emptyState: {
    textAlign: "center",
    padding: "64px 24px",
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
  },

  emptyIcon: {
    fontSize: "36px",
    color: "#94a3b8",
    marginBottom: "12px",
  },

  emptyTitle: {
    color: "#1e293b",
    marginBottom: "6px",
  },

  emptyDescription: {
    color: "#64748b",
  },
});

