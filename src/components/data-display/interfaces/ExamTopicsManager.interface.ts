/**
 * Interface definition for ExamTopicsManager component.
 */

export interface ExamTopicItem {
  id: string;
  title: string;
  description: string | null;
  subtopics?: { id: string; title: string }[];
  quizzes?: { id: string; title: string }[];
  exams?: { id: string; title: string }[];
  _count?: { subtopics: number; quizzes: number; questions: number };
}

export interface ExamWithTopics {
  id: string;
  title: string;
  description: string | null;
  topics: ExamTopicItem[];
}

export interface ExamTopicsManagerProps {
  /** The parent exam with its linked main topics preloaded. */
  exam: ExamWithTopics;
  /** All standalone main topics available for linking. */
  availableStandaloneTopics?: ExamTopicItem[];
}
