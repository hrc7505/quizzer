/**
 * Interfaces for QuizScoreCelebration component.
 */

export type ScoreTier = "danger" | "improvement" | "moderate" | "appreciation" | "outstanding" | "perfect";

export interface ScoreTierMeta {
  tier: ScoreTier;
  title: string;
  subtitle: string;
  badgeVariant: "danger" | "warning" | "default" | "success" | "secondary";
  gradientClass: string;
  glowClass: string;
  iconName: "skull" | "flame" | "target" | "star" | "trophy" | "crown";
}

export interface QuizScoreCelebrationProps {
  /** Score percentage from 0 to 100 */
  scorePercentage: number;
  /** Total questions in the quiz */
  totalQuestions?: number;
  /** Correct answers count */
  correctCount?: number;
  /** Optional custom container CSS classes */
  className?: string;
  /** Whether to play sound on mount (defaults to true) */
  autoPlaySound?: boolean;
}
