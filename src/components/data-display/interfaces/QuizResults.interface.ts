/**
 * Represents a single question's structural data.
 */
export interface QuestionData {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  description: string;
  elaboration: string | null;
  topic?: { id: string; title: string };
}

/**
 * Represents a quiz containing its questions and topics.
 */
export interface QuizData {
  id: string;
  title: string;
  difficulty?: string;
  questions: QuestionData[];
  topics: { id: string }[];
}

/**
 * Represents a user's answer to a quiz question.
 */
export interface UserAnswerData {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

/**
 * Represents a quiz attempt record.
 */
export interface QuizAttemptData {
  id: string;
  quizId: string;
  quiz: QuizData;
  scorePercentage: number;
  correctCount: number;
  wrongCount: number;
  timeTakenSec: number;
  createdAt: Date | string;
  answers: UserAnswerData[];
}

/**
 * Props for the QuizResults component.
 */
export interface QuizResultsProps {
  attempt: QuizAttemptData;
}
