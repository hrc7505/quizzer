/**
 * Interface definition for TopicSubtopicsManager component.
 */

export interface SubtopicItem {
  id: string;
  title: string;
  description: string | null;
  quizzes?: { id: string; title: string }[];
  parentTopics?: { id: string; title: string }[];
  _count?: { quizzes: number; questions: number };
}

export interface TopicWithSubtopics {
  id: string;
  title: string;
  description: string | null;
  exams?: { id: string; title: string }[];
  parentTopics?: { id: string; title: string }[];
  subtopics: SubtopicItem[];
}

export interface TopicSubtopicsManagerProps {
  /** The parent main topic with its nested subtopics preloaded. */
  topic: TopicWithSubtopics;
  /** All available subtopics for linking. */
  availableSubtopics?: SubtopicItem[];
}
