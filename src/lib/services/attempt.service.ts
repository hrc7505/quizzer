import { api } from "@/lib/api";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  image?: string | null;
  scorePercentage?: number;
  timeTakenSec?: number;
}

interface StartAttemptResult {
  success: boolean;
  attemptId?: string;
  answers?: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
  timeTakenSec?: number;
  error?: string;
}

export const AttemptService = {
  startAttempt: async (
    quizId: string,
    options?: { forceNew?: boolean; createOnNotFound?: boolean }
  ): Promise<StartAttemptResult> => {
    const res = await api.post<StartAttemptResult>("/api/attempt", {
      quizId,
      forceNew: options?.forceNew,
      createOnNotFound: options?.createOnNotFound,
    });
    if (res.success && res.data) return res.data;
    return { success: false, error: res.error || "Failed to start attempt" };
  },

  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    timeTakenSec: number,
    signal?: AbortSignal
  ): Promise<{ success: boolean }> => {
    const res = await api.post<{ success: boolean }>(
      "/api/attempt/save",
      { attemptId, questionId, selectedAnswer, isCorrect, timeTakenSec },
      { signal }
    );
    if (res.success && res.data) return res.data;
    return { success: false };
  },

  completeAttempt: async (
    attemptId: string,
    timeTakenSec: number
  ): Promise<{ success: boolean; attemptId: string }> => {
    const res = await api.post<{ success: boolean; attemptId: string }>(
      "/api/attempt/complete",
      { attemptId, timeTakenSec }
    );
    if (res.success && res.data) return res.data;
    return { success: false, attemptId: "" };
  },

  getLeaderboard: async (quizId: string): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>(`/api/quiz/${quizId}/leaderboard`);
    if (res.success && res.data) return res.data;
    return [];
  },
};