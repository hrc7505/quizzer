/**
 * Represents a quiz associated with a topic.
 */
export interface QuizSummary {
  id: string;
  title: string;
  quizOrder: number;
  difficulty: string;
  _count: { questions: number };
}

export interface TopicData {
  id: string;
  title: string;
  quizzes: QuizSummary[];
  subtopics?: TopicData[];
}

export interface ExamData {
  id: string;
  title: string;
  description: string | null;
  topics: TopicData[];
}

/**
 * Props for the TopicList component.
 */
export interface TopicListProps {
  exams: ExamData[];
  standaloneTopics: TopicData[];
}
