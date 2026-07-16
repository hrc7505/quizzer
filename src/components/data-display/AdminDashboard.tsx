"use client";

import { Card, CardHeader, Text } from "@fluentui/react-components";
import { LinkButton } from "@/components/ui/LinkButton";
import { useAdminDashboardStyles } from "./styles/useAdminDashboardStyles";

interface Stats {
  topicsCount: number;
  subtopicsCount: number;
  quizzesCount: number;
  questionsCount: number;
  attemptsCount: number;
  avgScore: number;
}

export function AdminDashboard({ stats }: { stats: Stats }) {
  const styles = useAdminDashboardStyles();
  return (
    <div className={styles.root}>
      <Text size={700} weight="bold" className={styles.title}>Admin Dashboard</Text>
      
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader header={<Text weight="semibold">Topics</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.topicsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Sub Topics</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.subtopicsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Quizzes</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.quizzesCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Questions</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.questionsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Attempts</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.attemptsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Average Score</Text>} />
          <Text size={800} weight="bold" className={styles.statCardValue}>{stats.avgScore}%</Text>
        </Card>
      </div>

      <div className={styles.actionsRow}>
        <LinkButton href="/admin/generate" appearance="primary" size="large">Generate New Quiz</LinkButton>
        <LinkButton href="/admin/manage" appearance="secondary" size="large">Manage Taxonomy</LinkButton>
      </div>
    </div>
  );
}
