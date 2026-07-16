import { GenerateQuizPayload, GenerateQuizResponse } from "@/components/forms/interfaces/GenerateQuizForm.interface";

/**
 * Service to handle API requests related to Quizzes.
 */
export const QuizService = {
  /**
   * Generates a quiz by calling the admin API.
   * 
   * @param payload - The data required to generate the quiz.
   * @returns A promise that resolves to the API response.
   */
  generateQuiz: async (payload: GenerateQuizPayload): Promise<GenerateQuizResponse> => {
    const formData = new FormData();
    formData.append("mode", payload.mode);
    if (payload.topicTitle) {
      formData.append("topicTitle", payload.topicTitle);
    }
    if (payload.existingTopicId) {
      formData.append("existingTopicId", payload.existingTopicId);
    }
    formData.append("difficulty", payload.difficulty);
    
    if (payload.mode === "text" && payload.topicText) {
      formData.append("topicText", payload.topicText);
    }
    
    if (payload.mode === "pdf" && payload.file) {
      formData.append("file", payload.file);
    }

    const res = await fetch("/api/admin/generate-quiz", {
      method: "POST",
      body: formData,
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate quiz");
    }
    
    return data;
  }
};
