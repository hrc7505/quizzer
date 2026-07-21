"use client";

import Link from "next/link";

import { Card } from "@/components/ui/Card";

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
          <Link href="/admin/generate">
            <Card className="h-9 px-4 flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="text-xs font-semibold">Generate New Quiz</span>
            </Card>
          </Link>
          <Link href="/admin/manage/exams">
            <Card className="h-9 px-4 flex items-center justify-center bg-secondary text-secondary-foreground border-border/80 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer">
              <span className="text-xs font-semibold">Manage Taxonomy</span>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="flex flex-col justify-between p-5 bg-primary border-border/80 hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="text-xs font-semibold text-primary-foreground/80 uppercase tracking-wider">
                {card.label}
              </span>
              <span className="text-3xl font-bold text-primary-foreground tracking-tight mt-3">
                {card.value}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
