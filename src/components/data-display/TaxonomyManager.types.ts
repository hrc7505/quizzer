export interface Exam {
  id: string;
  title: string;
  description: string | null;
  topics: Topic[];
}

export interface QuizSummary {
  id: string;
  title: string;
  quizOrder: number;
  difficulty: string;
  topics?: { id: string }[];
  _count?: { questions: number };
}

export interface QuizQuestionDetail {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  hint?: string | null;
  description?: string | null;
}

export interface QuizDetail {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  questions?: QuizQuestionDetail[];
}

export interface Topic {
  id: string;
  title: string;
  description: string | null;
  exams?: Exam[];
  parentTopics?: Topic[];
  subtopics?: Topic[];
  quizzes?: QuizSummary[];
  _count?: { quizzes: number; questions: number };
}

export interface FlatTopic extends Topic {
  displayType: string;
}
