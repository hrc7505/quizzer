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
  },
  leaderboardCard: {
    marginTop: "24px",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  leaderboardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  leaderboardIcon: {
    fontSize: "20px",
  },
  leaderboardTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "8px",
  },
  leaderboardRow: {
    borderBottom: "1px solid #f1f5f9",
  },
  leaderboardHeaderCell: {
    padding: "8px",
    textAlign: "left",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
  },
  leaderboardHeaderColRank: {
    width: "60px",
  },
  leaderboardHeaderColScore: {
    textAlign: "center",
  },
  leaderboardHeaderColTime: {
    textAlign: "right",
  },
  leaderboardCell: {
    padding: "10px 8px",
    fontSize: "14px",
    color: "#334155",
  },
  leaderboardCellScore: {
    textAlign: "center",
    fontWeight: "bold",
  },
  leaderboardCellTime: {
    textAlign: "right",
    fontFamily: "monospace",
  },
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    fontWeight: "bold",
    fontSize: "12px",
  },
  rankGold: { color: "#92400e", backgroundColor: "#fef3c7" },
  rankSilver: { color: "#374151", backgroundColor: "#e5e7eb" },
  rankBronze: { color: "#78350f", backgroundColor: "#ffedd5" },
  rankDefault: { color: "#64748b", backgroundColor: "#f1f5f9" },
  playerGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});
