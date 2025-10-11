// App Preloader Service
// Handles all data loading during splash screen for smooth app startup
// Eliminates white screen by preloading essential data in background

import { apiGetMe, readProfileCache, writeProfileCache } from '../constants/api';
import { ExpoStepsService } from './stepsService';
import { StepsStorageService } from '../utils/stepsStorage';
import * as SecureStore from 'expo-secure-store';

const K_TOKEN = 'fu_token';

export interface PreloadProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
}

export interface PreloadedData {
  userProfile?: any;
  stepsData?: any;
  themeInitialized: boolean;
  fontsLoaded: boolean;
  authToken?: string | null;
  isAuthenticated?: boolean;
}

// App Preloader Class
// Manages all startup data loading with real progress tracking
export class AppPreloader {
  private static instance: AppPreloader;
  private progressCallbacks: Array<(progress: PreloadProgress) => void> = [];
  private preloadedData: PreloadedData = {
    themeInitialized: false,
    fontsLoaded: false,
    authToken: null,
    isAuthenticated: false,
  };

  private constructor() {}

  static getInstance(): AppPreloader {
    if (!AppPreloader.instance) {
      AppPreloader.instance = new AppPreloader();
    }
    return AppPreloader.instance;
  }

  // Set progress callback for real-time updates (supports multiple callbacks)
  setProgressCallback(callback: (progress: PreloadProgress) => void) {
    this.progressCallbacks.push(callback);
  }

  // Remove a specific callback
  removeProgressCallback(callback: (progress: PreloadProgress) => void) {
    this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
  }

  // Update progress with stage information
  private updateProgress(stage: string, progress: number, message: string) {
    const progressData = { stage, progress, message };
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progressData);
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  // Preload user profile data (background loading)
  private async preloadUserProfile(): Promise<void> {
    try {
      // 1) Load from cache instantly for immediate display
      const cached = await readProfileCache();
      if (cached) {
        this.preloadedData.userProfile = cached;
      }

      // 2) Fetch fresh data from API in background
      const { user } = await apiGetMe();
      if (user) {
        this.preloadedData.userProfile = user;
        await writeProfileCache(user);
      }
    } catch (error) {
      console.warn('Failed to preload user profile:', error);
    }
  }

  // Preload steps data (background loading)
  private async preloadStepsData(): Promise<void> {
    try {
      const stepsService = new ExpoStepsService();
      const storageService = new StepsStorageService();
      
      // Load cached steps data
      const cached = await storageService.load();
      const goal = await storageService.getGoal();
      const yesterday = await storageService.getYesterdaySteps();
      
      this.preloadedData.stepsData = {
        cached,
        goal,
        yesterday,
      };
    } catch (error) {
      console.warn('Failed to preload steps data:', error);
    }
  }

  // Initialize theme system (background loading)
  private async preloadTheme(): Promise<void> {
    try {
      // Theme initialization is synchronous, just mark as complete
      this.preloadedData.themeInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize theme:', error);
      this.preloadedData.themeInitialized = true; // Fallback to default theme
    }
  }

  // Mark fonts as loaded (background loading)
  markFontsLoaded(): void {
    this.preloadedData.fontsLoaded = true;
  }

  // Preload auth token (background loading)
  private async preloadAuthToken(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync(K_TOKEN);
      this.preloadedData.authToken = token;
      this.preloadedData.isAuthenticated = !!token;
    } catch (error) {
      console.warn('Failed to preload auth token:', error);
      this.preloadedData.authToken = null;
      this.preloadedData.isAuthenticated = false;
    }
  }

  // Main preload function - runs all loading tasks with realistic progress
  async preloadAll(): Promise<PreloadedData> {
    // Start with 1% immediately
    this.updateProgress('start', 1, 'Getting ready...');
    
    // Start real loading in background
    const loadingPromise = this.runRealLoading();
    
    // Run smooth progress animation (4 seconds total)
    const progressPromise = this.runSmoothProgress();
    
    // Wait for both to complete
    await Promise.all([loadingPromise, progressPromise]);
    
    return this.preloadedData;
  }

  // Run smooth progress animation over 4 seconds
  private async runSmoothProgress(): Promise<void> {
    const totalDuration = 4000; // 4 seconds
    const updateInterval = 50; // Update every 50ms
    const totalSteps = totalDuration / updateInterval; // 80 steps
    const progressPerStep = 99 / totalSteps; // Go from 1% to 100%
    
    for (let step = 0; step < totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, updateInterval));
      
      const currentProgress = Math.min(1 + (step * progressPerStep), 100);
      
      // Get appropriate message based on progress
      const message = this.getProgressMessage(currentProgress);
      
      this.updateProgress('smooth', currentProgress, message);
    }
    
    // Ensure we end at exactly 100%
    const finalMessage = this.preloadedData.userProfile?.username 
      ? `Welcome back, ${this.preloadedData.userProfile.username}!` 
      : 'Getting ready...';
    this.updateProgress('complete', 100, finalMessage);
  }

  // Get appropriate message based on current progress
  private getProgressMessage(progress: number): string {
    if (progress < 20) return 'Getting ready...';
    if (progress < 40) return 'Counting your calories...';
    if (progress < 60) return 'Planning your workouts...';
    if (progress < 80) return 'Tracking your progress...';
    if (progress < 95) return 'Almost there...';
    return this.preloadedData.userProfile?.username 
      ? `Welcome back, ${this.preloadedData.userProfile.username}!` 
      : 'Ready to go!';
  }

  // Run actual loading tasks in background
  private async runRealLoading(): Promise<void> {
    try {
      // Auth token must load first, then we can load user-specific data
      await this.preloadAuthToken();
      
      // Run remaining preload tasks in parallel (only if authenticated)
      const tasks = [this.preloadTheme()];
      
      if (this.preloadedData.isAuthenticated) {
        tasks.push(this.preloadUserProfile());
        tasks.push(this.preloadStepsData());
      }
      
      await Promise.allSettled(tasks);
    } catch (error) {
      console.error('Background loading failed:', error);
    }
  }

  // Get preloaded data
  getPreloadedData(): PreloadedData {
    return this.preloadedData;
  }

  // Reset preloader state
  reset(): void {
    this.preloadedData = {
      themeInitialized: false,
      fontsLoaded: false,
      authToken: null,
      isAuthenticated: false,
    };
  }
}

export default AppPreloader;
