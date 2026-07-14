import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate styles for the QuizResults component.
 */
export const useQuizResultsStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    width: '100%',
    "@media (max-width: 480px)": {
      ...shorthands.gap('16px'),
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: "28px",
    "@media (max-width: 640px)": {
      fontSize: "20px",
    },
  },
  desktopActions: {
    display: 'flex',
    ...shorthands.gap('12px'),
    alignItems: 'center',
    position: 'relative',
    "@media (max-width: 640px)": {
      display: 'none',
    },
  },
  moreActionsBtn: {
    display: 'none',
    "@media (max-width: 640px)": {
      display: 'inline-flex',
    },
  },
  actionBtn: {
    "@media (max-width: 640px)": {
      ...shorthands.flex(1, 1, 'auto'),
      width: '100%',
    },
  },
  actionLink: {
    "@media (max-width: 640px)": {
      ...shorthands.flex(1, 1, 'auto'),
      width: '100%',
      display: 'block',
    },
  },
  shareWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  shareTrigger: {
    whiteSpace: 'nowrap',
  },
  shareMenu: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    zIndex: 10,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '160px',
  },
  shareBtn: {
    width: '100%',
    justifyContent: 'flex-start',
  },


  link: {
    textDecoration: 'none',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    "@media (max-width: 480px)": {
      ...shorthands.gap('16px'),
    },
  },
  scoreDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('32px'),
    ...shorthands.gap('16px'),
    "@media (max-width: 480px)": {
      ...shorthands.padding('20px', '16px'),
      ...shorthands.gap('12px'),
    },
  },
  scoreNumber: {
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: '400px',
  },
  statsRow: {
    display: "flex",
    ...shorthands.gap("24px"),
    marginTop: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
    "@media (max-width: 480px)": {
      ...shorthands.gap("16px"),
    },
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
    "@media (max-width: 480px)": {
      ...shorthands.padding('16px'),
      width: '95vw',
    },
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
    "@media (max-width: 480px)": {
      ...shorthands.padding('16px'),
      marginTop: "16px",
    },
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
  leaderboardTableWrap: {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    ...shorthands.borderRadius('8px'),
  },
  leaderboardTable: {
    width: "100%",
    minWidth: "480px",
    borderCollapse: "collapse",
    marginTop: "8px",
    "@media (max-width: 480px)": {
      minWidth: "0",
      tableLayout: "fixed",
    },
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
    "@media (max-width: 480px)": {
      padding: "6px 4px",
      fontSize: "11px",
    },
  },
  leaderboardHeaderColRank: {
    width: "60px",
    "@media (max-width: 480px)": {
      width: "34px",
    },
  },
  leaderboardHeaderColScore: {
    width: "56px",
    textAlign: "center",
  },
  leaderboardHeaderColTime: {
    width: "56px",
    textAlign: "right",
  },
  leaderboardCell: {
    padding: "10px 8px",
    fontSize: "14px",
    color: "#334155",
    "@media (max-width: 480px)": {
      padding: "6px 4px",
      fontSize: "12px",
    },
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
    minWidth: "0",
  },
  playerName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: "0",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "16px",
  },
  emptyLeaderboardText: {
    color: "#94a3b8",
    fontStyle: "italic",
    display: "block",
    textAlign: "center",
    padding: "16px 0",
  },
  scoreValue: {
    fontWeight: "bold",
  },
  statCorrect: {
    color: "green",
  },
  statIncorrect: {
    color: "red",
  },
  questionTextAccordion: {
    color: "inherit",
  },
  questionTextAccordionWrong: {
    color: "#d13438",
  },
  deepDiveButton: {
    color: "#667eea",
  },
  markdownContainer: {
    overflowX: "auto",
  },
});
