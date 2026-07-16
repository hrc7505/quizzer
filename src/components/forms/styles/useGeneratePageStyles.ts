import { makeStyles, shorthands } from "@fluentui/react-components";

export const useGeneratePageStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("24px"),
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
  },
  description: {
    color: "#6b7280",
  },
});
