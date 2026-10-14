/**
 * Quiz attempt summary for user profile display.
 */
export interface ProfileAttemptItem {
  id: string;
  quizId: string;
  quizTitle: string;
  scorePercentage: number;
  correctCount: number;
  wrongCount: number;
  timeTakenSec: number;
  completed: boolean;
  createdAt: string;
  resolvedRoute?: string;
}

/**
 * Calculated learning metrics for user profile.
 */
export interface ProfileStats {
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  averageScore: number;
  bestScore: number;
  totalTimeSec: number;
}

/**
 * Data transparency item showing why specific data points are stored.
 */
export interface RecordedDataPurpose {
  category: string;
  fields: string[];
  purpose: string;
  retention: string;
}

/**
 * Summary of recorded user data points stored in the database.
 */
export interface RecordedDataSummary {
  userRecord: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  connectedAccounts: Array<{
    provider: string;
    type: string;
  }>;
  totalStoredAttempts: number;
  totalStoredAnswers: number;
  purposes: RecordedDataPurpose[];
}

/**
 * Complete profile payload returned by user profile API.
 */
export interface UserProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string;
    createdAt: string;
  };
  stats: ProfileStats;
  recentAttempts: ProfileAttemptItem[];
  recordedData: RecordedDataSummary;
}
