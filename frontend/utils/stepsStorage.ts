import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepsData, StepsStorage, HistoricalStepsData } from '../types/steps';

/**
 * Storage service for persisting steps data using AsyncStorage
 * Handles caching of daily steps data and user step goals
 * Implements the StepsStorage interface for consistent data persistence
 */
export class StepsStorageService implements StepsStorage {
  private cacheKey: string;
  private goalKey: string;
  private historyKey: string;

  constructor(
    cacheKey: string = 'daily_steps_cache', 
    goalKey: string = 'daily_steps_goal',
    historyKey: string = 'steps_history'
  ) {
    this.cacheKey = cacheKey;
    this.goalKey = goalKey;
    this.historyKey = historyKey;
  }

  async save(data: StepsData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('StepsStorage: Error saving steps data:', error);
      throw error;
    }
  }

  /**
   * Loads cached steps data, only returns data from today
   * Returns null if no valid cached data exists
   */
  async load(): Promise<StepsData | null> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const data: StepsData = JSON.parse(cached);
      
      // Only return cached data if it's from today
      const cachedDate = new Date(data.lastUpdated);
      const today = new Date();
      const isToday = cachedDate.toDateString() === today.toDateString();
      
      return isToday ? data : null;
    } catch (error) {
      console.error('StepsStorage: Error loading steps data:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('StepsStorage: Error clearing steps data:', error);
      throw error;
    }
  }

  async getGoal(): Promise<number> {
    try {
      const savedGoal = await AsyncStorage.getItem(this.goalKey);
      return savedGoal ? parseInt(savedGoal) : 12000; // Default goal
    } catch (error) {
      console.error('StepsStorage: Error loading step goal:', error);
      return 12000;
    }
  }

  async setGoal(goal: number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.goalKey, goal.toString());
    } catch (error) {
      console.error('StepsStorage: Error saving step goal:', error);
      throw error;
    }
  }

  /**
   * Saves historical steps data for a specific date
   */
  async saveHistoricalData(data: HistoricalStepsData): Promise<void> {
    try {
      const existingHistory = await this.getHistoricalData();
      const updatedHistory = {
        ...existingHistory,
        [data.date]: data
      };
      await AsyncStorage.setItem(this.historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('StepsStorage: Error saving historical data:', error);
      throw error;
    }
  }

  /**
   * Gets all historical steps data
   */
  async getHistoricalData(): Promise<Record<string, HistoricalStepsData>> {
    try {
      const history = await AsyncStorage.getItem(this.historyKey);
      return history ? JSON.parse(history) : {};
    } catch (error) {
      console.error('StepsStorage: Error loading historical data:', error);
      return {};
    }
  }

  /**
   * Gets steps data for a specific date
   */
  async getStepsForDate(date: string): Promise<HistoricalStepsData | null> {
    try {
      const history = await this.getHistoricalData();
      return history[date] || null;
    } catch (error) {
      console.error('StepsStorage: Error getting steps for date:', error);
      return null;
    }
  }

  /**
   * Gets yesterday's steps data
   */
  async getYesterdaySteps(): Promise<HistoricalStepsData | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    return await this.getStepsForDate(yesterdayStr);
  }
}
