/**
 * Interface representing a sample quiz question for the homepage animation.
 */
export interface SampleQuizQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: {
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: {
    summary: string;
    whyCorrect: string;
    whyWrong: string;
  };
  timeRemainingSec: number;
}

/**
 * Props for the QuizInteractiveAnimation component.
 */
export interface QuizInteractiveAnimationProps {
  className?: string;
  autoPlay?: boolean;
}
