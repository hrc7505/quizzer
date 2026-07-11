import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI styles for the AdminUsersManager component.
 */
export const useAdminUsersManagerStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  searchBar: {
    width: "100%",
    maxWidth: "350px",
  },
  errorText: {
    color: "#d13438",
    display: "block",
  },
  tableCard: {
    ...shorthands.padding("20px"),
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "24px",
    paddingBottom: "24px",
  },
  emptyRowCell: {
    display: "block",
    textAlign: "center",
    paddingTop: "24px",
    paddingBottom: "24px",
    color: "#888",
  },
  avatarCol: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  roleBadge: {
    fontWeight: "bold",
  },
  dialogBodyRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginTop: "12px",
  },
  dialogActionsRow: {
    marginTop: "16px",
  },
  btnConfirmDelete: {
    backgroundColor: "#d13438",
    color: "white",
    ":hover": {
      backgroundColor: "#a80000",
    },
  },
});
