import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate styles for the GenerateQuizForm component.
 */
export const useGenerateQuizFormStyles = makeStyles({
  card: {
    padding: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fileInput: {
    display: 'block',
    ...shorthands.margin('8px', '0'),
  },
  spinner: {
    ...shorthands.margin(0, '8px', 0, 0),
  },
  tabList: {
    marginBottom: '20px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '12px',
  }
});
