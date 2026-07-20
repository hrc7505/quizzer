import { api } from "@/lib/api";

import type { GenerateQuizResponse } from "@/components/forms/interfaces/GenerateQuizForm.interface";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = Record<string, any>;

export const QuizService = {
  generateQuiz: async (payload: Payload): Promise<GenerateQuizResponse> => {
    const res = await api.post<GenerateQuizResponse>("/api/admin/generate-quiz", payload);
    if (res.success && res.data) return res.data;
    return { totalQuestions: 0, quizzesCreated: 0, error: res.error || "Failed to generate quiz" };
  },

  generateWithAI: async (
    topicIds: string[],
    numQuestions: number,
    difficulty: string
  ): Promise<GenerateQuizResponse> => {
    return QuizService.generateQuiz({ topicIds, numQuestions, difficulty });
  },
};
