import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate styles for the QuizResults component.
 */
export const useQuizResultsStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
  },
  link: {
    textDecoration: 'none',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    backgroundColor: '#f9f9f9',
    ...shorthands.padding('16px'),
  },
  scoreDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('32px'),
    ...shorthands.gap('16px'),
  },
  scoreNumber: {
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: '400px',
  },
  statsRow: {
    display: 'flex',
    ...shorthands.gap('32px'),
    marginTop: '16px',
  },
  statCol: {
    textAlign: 'center',
  },
  accordionHeaderContent: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
  },
  accordionPanelContent: {
    ...shorthands.padding('16px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  correctAnswerBlock: {
    ...shorthands.padding('12px'),
    backgroundColor: '#e6ffed',
    ...shorthands.borderRadius('4px'),
    borderLeft: '4px solid #2da44e',
  },
  wrongAnswerBlock: {
    ...shorthands.padding('12px'),
    backgroundColor: '#ffebe9',
    ...shorthands.borderRadius('4px'),
    borderLeft: '4px solid #cf222e',
  },
  explanationBlock: {
    marginTop: '8px',
  },
  deepDiveRow: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  dialogSurface: {
    borderRadius: '12px',
    ...shorthands.padding('24px'),
    maxWidth: '800px',
    width: '90vw',
  },
  dialogContent: {
    overflowY: 'auto',
    maxHeight: '70vh',
    paddingTop: '16px',
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
  drawerSpinner: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('32px'),
  }
});
