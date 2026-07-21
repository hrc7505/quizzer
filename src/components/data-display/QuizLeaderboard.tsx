"use client";

import { memo } from "react";
import { Trophy, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { NoData } from "@/components/feedback/NoData";
import { cn } from "@/utils/cn";
import { formatTime } from "@/lib/text";

import type { LeaderboardEntry } from "@/lib/services/attempt.service";

interface QuizLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  loading?: boolean;
  title?: string;
  compact?: boolean;
}

const rankBadgeClass = (index: number) => {
  if (index === 0) return "bg-amber-500 text-white font-bold shadow-xs shadow-amber-500/25";
  if (index === 1) return "bg-slate-400 text-white font-bold shadow-xs shadow-slate-400/25";
  if (index === 2) return "bg-amber-700 text-white font-bold shadow-xs shadow-amber-700/25";
  return "bg-secondary text-secondary-foreground";
};

const scoreTextClass = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
};

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="py-2.5 px-3 text-center">
        <span
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px]",
            rankBadgeClass(index)
          )}
        >
          {index + 1}
        </span>
      </td>
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-2 min-w-0">
          {entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.image}
              alt={entry.name}
              className="h-5 w-5 rounded-full object-cover border border-border/40 shrink-0"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[9px] shrink-0">
              {entry.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className={cn("truncate font-medium text-foreground", index < 3 && "font-semibold")}>
            {entry.name}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-2 text-center">
        <span className={cn("font-bold", scoreTextClass(entry.scorePercentage ?? 0))}>
          {Math.round(entry.scorePercentage ?? 0)}%
        </span>
      </td>
      <td className="py-2.5 px-2 text-center text-muted-foreground/80 font-medium">
        {formatTime(entry.timeTakenSec ?? 0)}
      </td>
    </tr>
  );
}

const MemoizedLeaderboardRow = memo(LeaderboardRow);

export function QuizLeaderboard({
  leaderboard,
  loading = false,
  title = "Top 10 Rankings",
  compact = false,
}: QuizLeaderboardProps) {
  if (loading) {
    return (
      <Card className={`border-border/80 shadow-xs flex flex-col gap-4 ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Trophy className="h-5 w-5 text-warning shrink-0" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading leaderboard...</span>
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className={`border-border/80 shadow-xs flex flex-col gap-4 ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Trophy className="h-5 w-5 text-warning shrink-0" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
        </div>
        <NoData
          title="No rankings available yet."
          description="Be the first to top the leaderboard!"
          icon="sparkle"
          compact
        />
      </Card>
    );
  }

  return (
    <Card className={`border-border/80 shadow-xs flex flex-col gap-4 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <Trophy className="h-5 w-5 text-warning shrink-0" />
        <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground font-bold">
              <th scope="col" className="py-2.5 px-3 w-16 text-center">
                Rank
              </th>
              <th scope="col" className="py-2.5 px-2">
                Player
              </th>
              <th scope="col" className="py-2.5 px-2 text-center w-20">
                Score
              </th>
              <th scope="col" className="py-2.5 px-2 text-center w-20">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <MemoizedLeaderboardRow key={entry.userId} entry={entry} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default QuizLeaderboard;