/**
 * Service to handle quiz attempt-related API requests.
 */
import { UserAnswer } from "@prisma/client";

export interface StartAttemptResult {
  attemptId: string;
  answers: UserAnswer[];
  timeTakenSec: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string | null | undefined;
  image: string | null | undefined;
  scorePercentage: number | null;
  timeTakenSec: number | null;
  createdAt: Date;
  rank?: number;
}

export const AttemptService = {
  /**
   * Starts a new attempt or retrieves an active one for a quiz.
   * 
   * @param quizId - The ID of the quiz to play.
   * @returns A promise resolving to the attempt metadata.
   */
  startAttempt: async (quizId: string): Promise<StartAttemptResult> => {
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to start attempt");
    }
    return data;
  },

  /**
   * Saves an answered question dynamically during a quiz attempt.
   * 
   * @param attemptId - The active attempt ID.
   * @param questionId - The current question ID.
   * @param selectedAnswer - The text of the option selected.
   * @param isCorrect - Boolean indicating if the answer is correct.
   * @param timeTakenSec - Elapsed time in seconds.
   * @returns A promise resolving to a success confirmation.
   */
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    timeTakenSec: number,
    signal?: AbortSignal
  ): Promise<{ success: boolean }> => {
    const res = await fetch("/api/attempt/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId,
        selectedAnswer,
        isCorrect,
        timeTakenSec,
      }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save answer");
    }
    return data;
  },

  /**
   * Completes a quiz attempt and computes final scores.
   * 
   * @param attemptId - The active attempt ID.
   * @param timeTakenSec - The final time taken.
   * @returns A promise resolving to the completed attempt info.
   */
  completeAttempt: async (attemptId: string, timeTakenSec: number): Promise<{ success: boolean; attemptId: string }> => {
    const res = await fetch("/api/attempt/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, timeTakenSec }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to complete attempt");
    }
    return data;
  },

  /**
   * Fetches the top 10 unique user rankers for a quiz.
   * 
   * @param quizId - The quiz ID.
   * @returns A promise resolving to the leaderboard rankings.
   */
  getLeaderboard: async (quizId: string): Promise<LeaderboardEntry[]> => {
    const res = await fetch(`/api/quiz/${quizId}/leaderboard`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch leaderboard");
    }
    return data;
  },
};
