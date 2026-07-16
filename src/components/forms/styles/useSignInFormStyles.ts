import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI styles for the SignInForm component.
 */
export const useSignInFormStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    marginTop: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  submitButton: {
    width: "100%",
  },
});
