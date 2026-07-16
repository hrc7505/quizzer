import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate styles for the GenerateQuizForm component.
 */
export const useGenerateQuizFormStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
  },
  fullWidthInput: {
    width: "100%",
  },
  fullWidthTextarea: {
    width: "100%",
    minHeight: "80px",
  },
  tabList: {
    marginBottom: "20px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
    marginTop: "12px",
  },
  dropzone: {
    border: "2px dashed #ccc",
    borderRadius: "8px",
    padding: "32px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("8px"),
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dropzoneActive: {
    border: "2px dashed #0078d4",
    backgroundColor: "#f3f2f1",
  },
  dropzoneTitle: {
    color: "inherit",
  },
  dropzoneHint: {
    color: "#666",
  },
  submitButton: {
    alignSelf: "flex-start",
  },
  spinner: {
    ...shorthands.margin(0, "8px", 0, 0),
  },
});
