/**
 * Represents the response from the quiz generation API.
 */
export interface GenerateQuizResponse {
  /** The total number of questions generated or queued. */
  totalQuestions: number;
  /** The number of quizzes created from the generated questions. */
  quizzesCreated: number;
  /** Whether questions were appended directly to an existing quiz. */
  appended?: boolean;
  /** Number of questions appended. */
  questionsAdded?: number;
  /** Target quiz ID when appending. */
  quizId?: string;
  /** Whether the generation was split into persistent background batches. */
  isBatched?: boolean;
  /** Number of batches created in the queue. */
  batchesCreated?: number;
  /** Server message. */
  message?: string;
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
  targetQuizId?: string;
  targetQuizTitle?: string;
  difficulty: string;
  topicText?: string;
  file?: File | null;
  /** Whether AI should auto-pad incomplete quizzes with extra generated questions to reach 30 (default: false) */
  padTo30?: boolean;
}
