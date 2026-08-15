/**
 * Interface definition for SubtopicQuizzesManager component.
 */

export interface SubtopicQuizItem {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  topics?: { id: string; title: string }[];
  _count: { questions: number; attempts: number };
}

export interface SubtopicWithQuizzes {
  id: string;
  title: string;
  description: string | null;
  parentTopics?: { id: string; title: string }[];
  quizzes: SubtopicQuizItem[];
}

export interface SubtopicQuizzesManagerProps {
  /** The parent subtopic with its quizzes preloaded. */
  subtopic: SubtopicWithQuizzes;
  /** All available quizzes for linking. */
  availableQuizzes?: SubtopicQuizItem[];
}
