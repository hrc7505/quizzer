"use client";

import { Card, CardHeader, Text } from "@fluentui/react-components";
import { LinkButton } from "./LinkButton";

interface Stats {
  topicsCount: number;
  quizzesCount: number;
  questionsCount: number;
  attemptsCount: number;
  avgScore: number;
}

export function AdminDashboard({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text size={700} weight="bold">Admin Dashboard</Text>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card>
          <CardHeader header={<Text weight="semibold">Topics</Text>} />
          <Text size={800} weight="bold" style={{ padding: '0 16px 16px' }}>{stats.topicsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Quizzes</Text>} />
          <Text size={800} weight="bold" style={{ padding: '0 16px 16px' }}>{stats.quizzesCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Questions</Text>} />
          <Text size={800} weight="bold" style={{ padding: '0 16px 16px' }}>{stats.questionsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Attempts</Text>} />
          <Text size={800} weight="bold" style={{ padding: '0 16px 16px' }}>{stats.attemptsCount}</Text>
        </Card>
        <Card>
          <CardHeader header={<Text weight="semibold">Average Score</Text>} />
          <Text size={800} weight="bold" style={{ padding: '0 16px 16px' }}>{stats.avgScore}%</Text>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <LinkButton href="/admin/generate" appearance="primary" size="large">Generate New Quiz</LinkButton>
        <LinkButton href="/admin/manage" appearance="secondary" size="large">Manage Taxonomy</LinkButton>
      </div>
    </div>
  );
}
