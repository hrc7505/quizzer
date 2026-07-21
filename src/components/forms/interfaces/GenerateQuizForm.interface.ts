/**
 * Represents the response from the quiz generation API.
 */
export interface GenerateQuizResponse {
  /** The total number of questions generated. */
  totalQuestions: number;
  /** The number of quizzes created from the generated questions. */
  quizzesCreated: number;
  /** Any error message returned by the server, if applicable. */
  error?: string;
  /** Structured error metadata returned by the server for UI rendering. */
  errorMeta?: {
    icon: "image-off" | "alert-circle" | "alert-triangle" | "info";
    variant: "danger" | "warning" | "info";
  };
}

/**
 * Represents the payload to send when generating a quiz.
 * Using FormData since we might upload files.
 */
export interface GenerateQuizPayload {
  mode: "title" | "text" | "pdf";
  topicTitle?: string;
  existingTopicId?: string;
  difficulty: string;
  topicText?: string;
  file?: File | null;
}
