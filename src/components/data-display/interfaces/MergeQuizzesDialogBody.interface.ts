export interface MergeableQuiz {
  id: string;
  title: string;
  difficulty: string;
  quizOrder: number;
  _count: { questions: number; attempts: number };
}

export interface MergeQuizzesFormState {
  targetQuizId: string;
  targetTitle: string;
}

export interface MergeQuizzesDialogBodyProps {
  selectedQuizzes: MergeableQuiz[];
  initialForm: MergeQuizzesFormState;
  onConfirm: (form: MergeQuizzesFormState) => Promise<void>;
  loading?: boolean;
}
