import { BatchAction } from "@/types/batch";

import type { QuizTranslateStatus } from "@/components/data-display/interfaces/TranslateQuizDialogBody.interface";

/**
 * Client service layer for managing quiz translations and real-time queues.
 */
export const QuizTranslationClient = {
  /**
   * Fetches the current translation status and background queues for a quiz.
   */
  async getStatus(quizId: string, targetLanguage?: string): Promise<QuizTranslateStatus | null> {
    try {
      const url = targetLanguage
        ? `/api/admin/quizzes/${encodeURIComponent(quizId)}/translate?targetLanguage=${encodeURIComponent(targetLanguage)}`
        : `/api/admin/quizzes/${encodeURIComponent(quizId)}/translate`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as QuizTranslateStatus;
    } catch (err) {
      console.warn("QuizTranslationClient.getStatus failed:", err);
      return null;
    }
  },

  /**
   * Starts a background translation for a specific target language.
   */
  async startTranslation(params: {
    quizId: string;
    targetLanguage: string;
    resume?: boolean;
    batchSize?: number;
  }): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(params.quizId)}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: BatchAction.START,
          targetLanguage: params.targetLanguage,
          resume: params.resume === true,
          batchSize: params.batchSize || 6,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("QuizTranslationClient.startTranslation failed:", err);
      return { error: "Failed to start translation" };
    }
  },

  /**
   * Resumes a paused or failed background translation queue for a specific target language.
   */
  async resumeTranslation(quizId: string, targetLanguage: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(quizId)}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: BatchAction.RESUME,
          targetLanguage,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("QuizTranslationClient.resumeTranslation failed:", err);
      return { error: "Failed to resume translation" };
    }
  },

  /**
   * Restarts translation from the beginning for a specific target language.
   */
  async restartTranslation(params: {
    quizId: string;
    targetLanguage: string;
    batchSize?: number;
  }): Promise<{ success?: boolean; error?: string }> {
    return QuizTranslationClient.startTranslation({
      quizId: params.quizId,
      targetLanguage: params.targetLanguage,
      resume: false,
      batchSize: params.batchSize,
    });
  },

  /**
   * Pauses an active translation queue for a specific target language.
   */
  async pauseTranslation(quizId: string, targetLanguage: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(quizId)}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: BatchAction.PAUSE,
          targetLanguage,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("QuizTranslationClient.pauseTranslation failed:", err);
      return { error: "Failed to pause translation" };
    }
  },

  /**
   * Cancels and deletes the translation queue for a specific target language.
   */
  async cancelTranslation(quizId: string, targetLanguage: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/quizzes/${encodeURIComponent(quizId)}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: BatchAction.CANCEL,
          targetLanguage,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("QuizTranslationClient.cancelTranslation failed:", err);
      return { error: "Failed to cancel translation" };
    }
  },
};
