export interface StepsData {
  steps: number;
  source: 'sensor' | 'cached';
  lastUpdated: string;
  goal: number;
  currentStreak: number;
  lastStreakDate: string | null;
  streakGoal: number;
}

export interface HistoricalStepsData {
  date: string; // YYYY-MM-DD format
  steps: number;
  goal: number;
  streakAchieved: boolean;
}

export interface StepsTrackingConfig {
  defaultGoal: number;
  cacheKey: string;
  goalKey: string;
}

export interface StepsService {
  getSteps(): Promise<number | null>;
  isAvailable(): Promise<boolean>;
}

export interface StepsStorage {
  save(data: StepsData): Promise<void>;
  load(): Promise<StepsData | null>;
  clear(): Promise<void>;
}
