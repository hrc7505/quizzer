/**
 * Represents a topic associated with a quiz question.
 */
export interface TopicInfo {
  id: string;
  title: string;
}

/**
 * Represents a quiz associated with a quiz question.
 */
export interface QuizInfo {
  id: string;
  title: string;
  difficulty: string;
}

/**
 * Represents a question along with its metadata and saved AI elaboration content.
 */
export interface QuestionInfo {
  id: string;
  text: string;
  correctAnswer: string;
  options?: string[];
  elaboration: string | null;
  topic: TopicInfo;
  quiz: QuizInfo | null;
}

/**
 * Props for the DeepDiveBody component.
 */
export interface DeepDiveBodyProps {
  question: QuestionInfo;
}
