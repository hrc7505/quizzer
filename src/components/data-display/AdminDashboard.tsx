"use client";

import { LinkButton } from "@/components/ui/LinkButton";

interface Stats {
  topicsCount: number;
  subtopicsCount: number;
  quizzesCount: number;
  questionsCount: number;
  attemptsCount: number;
  avgScore: number;
}

export function AdminDashboard({ stats }: { stats: Stats }) {
  const statCards = [
    { label: "Topics", value: stats.topicsCount, href: "/admin/manage/topics" },
    { label: "Sub Topics", value: stats.subtopicsCount, href: "/admin/manage/subtopics" },
    { label: "Quizzes", value: stats.quizzesCount, href: "/admin/manage/quizzes" },
    { label: "Questions", value: stats.questionsCount, href: "/admin/manage/quizzes" },
    { label: "Attempts", value: stats.attemptsCount, href: "/admin/manage/quizzes" },
    { label: "Average Score", value: `${stats.avgScore}%`, href: "/admin" },
  ];

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <LinkButton href="/admin/generate" variant="primary" className="h-9 px-4 font-semibold text-xs shadow-xs">
            Generate New Quiz
          </LinkButton>
          <LinkButton href="/admin/manage/exams" variant="secondary" className="h-9 px-4 font-semibold text-xs">
            Manage Taxonomy
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <LinkButton
            key={card.label}
            href={card.href}
            className="flex flex-col justify-between p-5 bg-card border-border/80 hover:shadow-sm transition-all duration-200"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-3xl font-bold text-foreground tracking-tight mt-3">
              {card.value}
            </span>
          </LinkButton>
        ))}
      </div>
    </div>
  );
}
