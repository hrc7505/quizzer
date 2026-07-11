import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate Fluent UI styles for the QuizWizard component.
 */
export const useQuizWizardStyles = makeStyles({
  container: {
    maxWidth: "800px",
    ...shorthands.margin("0", "auto"),
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
  },
  questionCard: {
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },
  questionTextRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  optionsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "24px",
  },
  optionItem: {
    padding: "16px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    ...shorthands.border("2px", "solid", "#e2e8f0"),
  },
  optionDefault: {
    backgroundColor: "#f8fafc",
    color: "#1e293b",
  },
  optionCorrect: {
    backgroundColor: "#ecfdf5",
    color: "#065f46",
    ...shorthands.borderColor("#10b981"),
  },
  optionIncorrect: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    ...shorthands.borderColor("#ef4444"),
  },
  explanationBox: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    borderLeft: "4px solid #3b82f6",
  },
  actionsRow: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "flex-end",
  },
  btnNext: {
    minWidth: "140px",
  },
  startCard: {
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  startIconContainer: {
    display: "inline-flex",
    backgroundColor: "#e0e7ff",
    padding: "12px",
    borderRadius: "50%",
    marginBottom: "16px",
  },
  startTitle: {
    display: 'block',
    marginBottom: '8px',
  },
  startSubtitle: {
    color: '#64748b',
    display: 'block',
    marginBottom: '24px',
  },
  startButtonsRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnResume: {
    height: '48px',
    paddingLeft: '24px',
    paddingRight: '24px',
    backgroundColor: '#10b981',
    color: 'white',
    ':hover': {
      backgroundColor: '#059669',
    },
  },
  btnStartFresh: {
    height: '48px',
    paddingLeft: '24px',
    paddingRight: '24px',
  },
  btnStart: {
    height: '48px',
    paddingLeft: '28px',
    paddingRight: '28px',
    backgroundColor: '#4f46e5',
    color: 'white',
    ':hover': {
      backgroundColor: '#4338ca',
    },
  },
  leaderboardCard: {
    marginTop: "24px",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  leaderboardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  leaderboardEmptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    display: 'block',
    textAlign: 'center',
    padding: '16px 0',
  },
  leaderboardTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  },
  leaderboardRow: {
    borderBottom: "1px solid #f1f5f9",
  },
  leaderboardHeaderCell: {
    padding: "10px",
    textAlign: "left",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
  },
  leaderboardHeaderColRank: {
    width: '60px',
  },
  leaderboardHeaderColScore: {
    textAlign: 'center',
  },
  leaderboardHeaderColTime: {
    textAlign: 'right',
  },
  leaderboardCell: {
    padding: "12px 10px",
    fontSize: "14px",
    color: "#334155",
  },
  leaderboardCellScore: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  leaderboardCellTime: {
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontWeight: 'bold',
  },
  rankGold: { color: "#92400e", backgroundColor: "#fef3c7" },
  rankSilver: { color: "#374151", backgroundColor: "#e5e7eb" },
  rankBronze: { color: "#78350f", backgroundColor: "#ffedd5" },
  rankDefault: { color: "#64748b", backgroundColor: "#f1f5f9" },
  avatarGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});
