// Shared types for Steps Performance Chart components

export interface ChartData {
  date: string;
  steps: number;
  maxSteps: number;
}

export interface StepsPerformanceProps {
  currentSteps: number; // Real-time steps from useStepsTracking
  onStatsLoaded?: (stats: any) => void; // Optional callback when stats are loaded
}

export interface ChartDimensions {
  width: number;
  height: number;
}

export type PeriodType = 'week' | 'month';

