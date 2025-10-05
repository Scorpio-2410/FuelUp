import { Pedometer } from 'expo-sensors';
import { StepsService } from '../types/steps';

/**
 * Service for tracking steps using expo-sensors Pedometer
 * Handles device sensor availability checks and step count retrieval
 * Implements the StepsService interface for consistent step tracking
 */
export class ExpoStepsService implements StepsService {
  async isAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('ExpoStepsService: Error checking pedometer availability:', error);
      return false;
    }
  }

  /**
   * Retrieves step count for today from device pedometer sensor
   * Returns null if sensor is unavailable or error occurs
   */
  async getSteps(): Promise<number | null> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return null;
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const result = await Pedometer.getStepCountAsync(startOfDay, today);
      const steps = result.steps || 0;
      
      return steps;
    } catch (error) {
      console.error('ExpoStepsService: Error getting steps:', error);
      return null;
    }
  }
}
