import { makeStyles, shorthands } from "@fluentui/react-components";

export const useAuthPageStyles = makeStyles({
  pageRoot: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  pageRootLight: {
    backgroundColor: "#f8fafc",
  },
  pageRootDark: {
    backgroundColor: "#0f172a",
  },
  card: {
    width: "400px",
    maxWidth: "100%",
    padding: "32px",
  },
  cardLight: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  },
  cardDark: {
    boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    marginBottom: "8px",
  },
  iconColorPrimary: {
    color: "#0078d4",
  },
  descriptionText: {
    color: "#64748b",
  },
  errorBar: {
    marginTop: "16px",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    marginTop: "24px",
  },
  googleButton: {
    backgroundColor: "#0078d4",
    color: "white",
    fontWeight: 600,
    height: "44px",
    borderRadius: "6px",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    margin: "12px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    ...shorthands.padding("0", "8px"),
    color: "#94a3b8",
  },
  devForm: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  inputHeight: {
    height: "36px",
  },
  outlineButton: {
    height: "36px",
  },
  adminWarning: {
    marginTop: "12px",
    borderRadius: "8px",
  },
});
