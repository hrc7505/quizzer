import { api } from "@/lib/api";

import type { GenerateQuizResponse } from "@/components/forms/interfaces/GenerateQuizForm.interface";

function buildFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    formData.append(key, value as unknown as FormDataEntryValue);
  }
  return formData;
}

export const QuizService = {
  generateQuiz: async (payload: Record<string, unknown>): Promise<GenerateQuizResponse> => {
    const formData = buildFormData(payload);
    const res = await api.post<GenerateQuizResponse>("/api/admin/generate-quiz", formData);
    if (res.success && res.data) return res.data;
    return {
      totalQuestions: 0,
      quizzesCreated: 0,
      error: res.error || "Failed to generate quiz",
      errorMeta: res.data?.errorMeta,
    };
  },

  generateWithAI: async (
    topicIds: string[],
    numQuestions: number,
    difficulty: string
  ): Promise<GenerateQuizResponse> => {
    return QuizService.generateQuiz({ topicIds, numQuestions, difficulty });
  },
};
