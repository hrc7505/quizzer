import { makeStyles, shorthands } from "@fluentui/react-components";

/**
 * Hook to generate styles for the TopicList component.
 */
export const useTopicListStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('32px'),
  },
  topicContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  topicHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    ...shorthands.gap('16px'),
  },
  cardContent: {
    ...shorthands.padding('0', '16px', '16px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  link: {
    textDecoration: 'none',
  },
  button: {
    width: '100%',
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding('48px'),
  },
  interactiveCard: {
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    backgroundColor: 'white',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.06)'
    }
  }
});
