import { useState, useEffect, useCallback } from 'react';
import { StepsData, HistoricalStepsData } from '../types/steps';
import { ExpoStepsService } from '../services/stepsService';
import { StepsStorageService } from '../utils/stepsStorage';
import { apiUpsertSteps, apiGetStepsChart, apiGetStepsStreak } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom hook for managing steps tracking functionality
// Provides real-time step counting, caching, goal management, and server sync
// Integrates sensor data with persistent storage and backend database

interface UseStepsTrackingReturn {
  stepsData: StepsData;
  isLoading: boolean;
  isAvailable: boolean;
  hasError: boolean;
  yesterdaySteps: HistoricalStepsData | null;
  updateSteps: () => Promise<void>;
  updateGoal: (goal: number) => Promise<void>;
  refreshSteps: () => Promise<void>;
  syncToServer: () => Promise<void>;
}

export const useStepsTracking = (): UseStepsTrackingReturn => {
  const [stepsData, setStepsData] = useState<StepsData>({
    steps: 0,
    source: 'cached',
    lastUpdated: new Date().toISOString(),
    goal: 8000,
    currentStreak: 0,
    lastStreakDate: null,
    streakGoal: 8000
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [yesterdaySteps, setYesterdaySteps] = useState<HistoricalStepsData | null>(null);

  const stepsService = new ExpoStepsService();
  const storageService = new StepsStorageService();
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const loadCachedData = useCallback(async () => {
    try {
      const cached = await storageService.load();
      const goal = await storageService.getGoal();
      const yesterday = await storageService.getYesterdaySteps();
      
      if (cached) {
        setStepsData(prev => ({ ...prev, ...cached, goal }));
        setHasError(false);
      } else {
        setStepsData(prev => ({ ...prev, goal }));
        setHasError(false);
      }
      
      setYesterdaySteps(yesterday);
      setIsLoading(false); // Ensure loading is set to false
    } catch (error) {
      console.error('useStepsTracking: Error loading cached data:', error);
      setHasError(true);
      setIsLoading(false); // Ensure loading is set to false even on error
    }
  }, [storageService]);

  /**
   * Smart refresh - only refreshes if data is older than 15 minutes
   * Similar to Apple Health approach
   */
  const shouldRefreshData = useCallback((lastUpdated: string): boolean => {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = new Date().getTime();
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    return (now - lastUpdateTime) > fifteenMinutes;
  }, []);

  // Calculates streak based on current steps and previous streak data
  // Returns newStreak, newLastStreakDate, streakJustAchieved, and streakJustLost flags
  const calculateStreak = useCallback((
    steps: number, 
    currentStreak: number, 
    lastStreakDate: string | null
  ): { 
    newStreak: number; 
    newLastStreakDate: string | null; 
    streakJustAchieved: boolean;
    streakJustLost: boolean;
  } => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const streakAchieved = steps >= stepsData.streakGoal;
    
    if (streakAchieved) {
      if (lastStreakDate === yesterdayStr) {
        // Consecutive day - increment streak
        return { newStreak: currentStreak + 1, newLastStreakDate: today, streakJustAchieved: true, streakJustLost: false };
      } else if (lastStreakDate === today) {
        // Same day - keep current streak (already achieved today)
        return { newStreak: currentStreak, newLastStreakDate: lastStreakDate, streakJustAchieved: false, streakJustLost: false };
      } else if (!lastStreakDate || lastStreakDate < yesterdayStr) {
        // New streak starting (missed a day or no previous streak)
        return { newStreak: 1, newLastStreakDate: today, streakJustAchieved: true, streakJustLost: false };
      } else {
        // First time achieving today
        return { newStreak: 1, newLastStreakDate: today, streakJustAchieved: true, streakJustLost: false };
      }
    } else {
      // Check if we missed yesterday (streak should be reset)
      if (lastStreakDate && lastStreakDate < yesterdayStr && currentStreak > 0) {
        // Missed a day - reset streak to 0 (STREAK LOST)
        return { newStreak: 0, newLastStreakDate: null, streakJustAchieved: false, streakJustLost: true };
      }
      // Still same day, not achieved yet - maintain current streak
      return { newStreak: currentStreak, newLastStreakDate: lastStreakDate, streakJustAchieved: false, streakJustLost: false };
    }
  }, [stepsData.streakGoal]);

  // Updates steps data and persists to storage
  // Handles both sensor and cached data sources
  const updateStepsData = useCallback(async (steps: number, source: 'sensor' | 'cached') => {
    setStepsData(prevData => {
      const { newStreak, newLastStreakDate, streakJustAchieved, streakJustLost } = calculateStreak(steps, prevData.currentStreak, prevData.lastStreakDate);
      
      const newData: StepsData = {
        ...prevData,
        steps,
        source,
        lastUpdated: new Date().toISOString(),
        currentStreak: newStreak,
        lastStreakDate: newLastStreakDate
      };
      
      // Save to storage asynchronously
      storageService.save(newData);
      
      // Save historical data for today
      const today = new Date().toISOString().split('T')[0];
      const historicalData: HistoricalStepsData = {
        date: today,
        steps,
        goal: prevData.goal,
        streakAchieved: steps >= prevData.streakGoal
      };
      storageService.saveHistoricalData(historicalData);
      
      return newData;
    });
  }, [storageService, calculateStreak]);

  const updateSteps = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Check if pedometer is available
      const available = await stepsService.isAvailable();
      setIsAvailable(available);
      
      if (!available) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      // Get fresh steps data
      const steps = await stepsService.getSteps();
      if (steps !== null) {
        await updateStepsData(steps, 'sensor');
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('useStepsTracking: Error updating steps:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [stepsService, updateStepsData]);

  const updateGoal = useCallback(async (goal: number) => {
    try {
      await storageService.setGoal(goal);
      setStepsData(prev => ({ ...prev, goal }));
    } catch (error) {
      console.error('useStepsTracking: Error updating goal:', error);
    }
  }, [storageService]);

  const refreshSteps = useCallback(async () => {
    await updateSteps();
  }, [updateSteps]);

  // Sync ALL historical data to server (one-time migration)
  const syncHistoricalData = useCallback(async () => {
    try {
      const history = await storageService.getHistoricalData();
      const entries = Object.entries(history);
      
      if (entries.length === 0) {
        return;
      }

      
      // Sync all historical data
      for (const [date, data] of entries) {
        try {
          await apiUpsertSteps({
            date: date,
            stepCount: data.steps,
          });
        } catch (err) {
          console.error(`useStepsTracking: Failed to sync ${date}:`, err);
        }
      }
      
    } catch (error) {
      console.error('useStepsTracking: Historical sync failed:', error);
    }
  }, [storageService]);

  // Sync steps to server (called periodically or manually)
  const syncToServer = useCallback(async () => {
    try {
      // Prevent rapid repeated syncs (minimum 5 minutes between syncs)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      if (now - lastSyncTime < fiveMinutes) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Only sync if we have step data
      if (stepsData.steps > 0) {

        await apiUpsertSteps({
          date: today,
          stepCount: stepsData.steps,
        });

        setLastSyncTime(now);
      }
    } catch (error) {
      console.error('useStepsTracking: Server sync failed:', error);
      // Don't show error to user - sync will retry later
      // Local data is still preserved
    }
  }, [stepsData.steps, lastSyncTime]);

  // Initialize on mount - load cached data only
  useEffect(() => {
    const initialize = async () => {
      await loadCachedData();
      // Check sensor availability but don't auto-fetch
      const available = await stepsService.isAvailable();
      setIsAvailable(available);
    };

    initialize();
  }, []); // Empty dependency array - only run once on mount

  // One-time historical data sync on first app load
  useEffect(() => {
    const runHistoricalSync = async () => {
      const syncedKey = 'historical_steps_synced';
      const alreadySynced = await storageService.load();
      
      // Check if we've already done historical sync
      try {
        const hasSynced = await AsyncStorage.getItem(syncedKey);
        if (!hasSynced) {
          await syncHistoricalData();
          await AsyncStorage.setItem(syncedKey, 'true');
        }
      } catch (error) {
        console.error('useStepsTracking: Error checking historical sync:', error);
      }
    };

    // Run after 5 seconds to let app initialize
    const timer = setTimeout(() => {
      runHistoricalSync();
    }, 5000);

    return () => clearTimeout(timer);
  }, [syncHistoricalData]);

  // Auto-sync to server every 30 minutes when app is active
  useEffect(() => {
    // Initial sync after 10 seconds (give time for app to load)
    const initialSync = setTimeout(() => {
      syncToServer();
    }, 10000);

    // Then sync every 30 minutes
    const interval = setInterval(() => {
      syncToServer();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearTimeout(initialSync);
      clearInterval(interval);
    };
  }, [syncToServer]);

  return {
    stepsData,
    isLoading,
    isAvailable,
    hasError,
    yesterdaySteps,
    updateSteps,
    updateGoal,
    refreshSteps,
    syncToServer,
  };
};
