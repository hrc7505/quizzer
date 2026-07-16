import { makeStyles, shorthands } from "@fluentui/react-components";

export const useAdminDashboardStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("24px"),
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    ...shorthands.gap("16px"),
  },
  statCardValue: {
    padding: "0 16px 16px",
  },
  actionsRow: {
    display: "flex",
    ...shorthands.gap("16px"),
    marginTop: "16px",
  },
});
