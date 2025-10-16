import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStepsTracking } from '../hooks/useStepsTracking';
import { apiGetStepsChart, apiGetStepsStreak, apiGetStepsByDate, StepStats, apiGetMe, apiGetFitnessProfile } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StreakCongratulationsAlert from '../components/StepsAnalysis/StreakCongratulationsAlert';
import StreakLostAlert from '../components/StepsAnalysis/StreakLostAlert';
import { StepsAnalyticsHeader } from '../components/StepsAnalysis/StepsAnalyticsHeader';
import { StepsHeader } from '../components/StepsAnalysis/StepsHeader';
import { ProgressBar } from '../components/StepsAnalysis/ProgressBar';
import { StepsLevel } from '../components/StepsAnalysis/StepsLevel';
import { StatsCards } from '../components/StepsAnalysis/StatsCards';
import Animated, { 
  FadeIn,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import DynamicBackground from '../components/Theme/DynamicTheme';
import { useTheme } from '../contexts/ThemeContext';
import RefreshScroll from '../components/RefreshScroll';

export default function StepsAnalytics() {
  const { stepsData, isLoading, isAvailable, hasError, yesterdaySteps, refreshSteps, updateGoal } = useStepsTracking();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [serverStats, setServerStats] = useState<StepStats | null>(null);
  const [serverStreak, setServerStreak] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showStreakAlert, setShowStreakAlert] = useState(false);
  const [showStreakLostAlert, setShowStreakLostAlert] = useState(false);
  const [lostStreakCount, setLostStreakCount] = useState<number>(0);
  const [serverYesterdaySteps, setServerYesterdaySteps] = useState<number>(0);
  const [userWeight, setUserWeight] = useState<number | undefined>(undefined);

  // Debug logging for yesterday steps
  React.useEffect(() => {
  }, [yesterdaySteps, serverYesterdaySteps]);

  // Animated progress value for smooth progress bar animation
  const progressWidth = useSharedValue(0);

  // Fetch fitness profile data for weight
  const fetchFitnessProfile = async () => {
    try {
      const { profile } = await apiGetFitnessProfile();
      if (profile?.weightKg) {
        setUserWeight(profile.weightKg);
      }
    } catch (error) {
    }
  };

  // Fetch backend stats (30 days for good average)
  const fetchServerStats = async () => {
    try {
      setLoadingStats(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      const startDateStr = startDate.toISOString().split('T')[0];

      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch stats, streak, and yesterday's data separately with individual error handling
      try {
        const chartData = await apiGetStepsChart(startDateStr, endDate);
        if (chartData.success && chartData.overallStats) {
          setServerStats(chartData.overallStats);
        }
      } catch (chartError) {
      }

      try {
        const streakData = await apiGetStepsStreak();
        if (streakData.success) {
          setServerStreak(streakData.streakDays);
        }
      } catch (streakError) {
      }

      try {
        const yesterdayData = await apiGetStepsByDate(yesterdayStr);
        if (yesterdayData.success && yesterdayData.stepRecord) {
          setServerYesterdaySteps(yesterdayData.stepRecord.stepCount);
        }
      } catch (yesterdayError) {
      }
    } catch (error) {
      // Don't show error - will use local data as fallback
    } finally {
      setLoadingStats(false);
    }
  };

  // Auto-refresh when screen loads (like normal apps)
  useEffect(() => {
    refreshSteps();
    fetchServerStats();
    fetchFitnessProfile();
  }, []); // Only run once when screen loads

  // Animate progress bar when steps change
  useEffect(() => {
    const targetProgress = stepsData.goal ? Math.min((stepsData.steps / stepsData.goal) * 100, 100) : 0;
    progressWidth.value = withTiming(targetProgress, {
      duration: 800,
    });
  }, [stepsData.steps, stepsData.goal, progressWidth]);

  // Auto-refresh removed for better user experience
  // Users can manually refresh using pull-to-refresh

  // Check if user just achieved goal and show congratulations
  useEffect(() => {
    const checkStreakAchievement = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastShownKey = `streak_alert_shown_${today}`;
        const alreadyShown = await AsyncStorage.getItem(lastShownKey);
        
        // Only show if:
        // 1. User has steps >= goal
        // 2. Haven't shown today
        // 3. User has a streak > 0
        // 4. Not currently loading
        if (!alreadyShown && 
            stepsData.steps >= stepsData.goal && 
            stepsData.currentStreak > 0 && 
            !isLoading) {
          setShowStreakAlert(true);
          await AsyncStorage.setItem(lastShownKey, 'true');
        }
      } catch (error) {
      }
    };

    checkStreakAchievement();
  }, [stepsData.steps, stepsData.goal, stepsData.currentStreak, isLoading]);

  // Check if user lost their streak and show alert
  useEffect(() => {
    const checkStreakLoss = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lostAlertKey = `streak_lost_alert_shown_${today}`;
        const previousStreakKey = 'previous_streak_count';
        const alreadyShown = await AsyncStorage.getItem(lostAlertKey);
        
        // Get stored previous streak
        const storedPrevStreak = await AsyncStorage.getItem(previousStreakKey);
        const previousStreak = storedPrevStreak ? parseInt(storedPrevStreak) : 0;
        
        // Check if streak was lost (had streak before, now it's 0)
        if (!alreadyShown && 
            previousStreak > 0 && 
            stepsData.currentStreak === 0 && 
            !isLoading) {
          setLostStreakCount(previousStreak);
          setShowStreakLostAlert(true);
          await AsyncStorage.setItem(lostAlertKey, 'true');
        }
        
        // Update stored streak for next time
        if (stepsData.currentStreak > 0) {
          await AsyncStorage.setItem(previousStreakKey, stepsData.currentStreak.toString());
        } else if (stepsData.currentStreak === 0 && previousStreak > 0) {
          // Clear previous streak after showing loss alert
          await AsyncStorage.removeItem(previousStreakKey);
        }
      } catch (error) {
      }
    };

    checkStreakLoss();
  }, [stepsData.currentStreak, isLoading]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.all([refreshSteps(), fetchServerStats(), fetchFitnessProfile()]);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  // Animate progress bar when steps change
  useEffect(() => {
    const targetProgress = stepsData.goal ? Math.min((stepsData.steps / stepsData.goal) * 100, 100) : 0;
    progressWidth.value = withTiming(targetProgress, {
      duration: 800,
    });
  }, [stepsData.steps, stepsData.goal, progressWidth]);

  return (
    <DynamicBackground
      theme={theme}
      intensity="medium">
      <SafeAreaView className="flex-1">
        <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
          <View className="p-6">
            {/* Header */}
            <StepsAnalyticsHeader />

            {/* Today's Steps */}
            <StepsHeader 
              steps={stepsData.steps}
              goal={stepsData.goal}
              currentStreak={stepsData.currentStreak}
              isLoading={isLoading}
              hasError={hasError}
            />

            {/* Progress Bar */}
            <Animated.View entering={FadeIn.delay(750).duration(900)}>
              <ProgressBar 
                progress={stepsData.steps}
                goal={stepsData.goal}
                isLoading={isLoading}
                hasError={hasError}
                progressWidth={progressWidth}
              />
            </Animated.View>

            {/* Step Levels */}
            <StepsLevel 
              steps={stepsData.steps}
              isLoading={isLoading}
              hasError={hasError}
            />

            {/* Stats Cards */}
            <StatsCards 
              serverStats={serverStats}
              serverStreak={serverStreak}
              serverYesterdaySteps={serverYesterdaySteps}
              yesterdaySteps={yesterdaySteps}
              loadingStats={loadingStats}
              userWeight={userWeight}
              todaySteps={stepsData.steps}
            />
          </View>
        </RefreshScroll>
      </SafeAreaView>

      {/* Streak Congratulations Alert */}
      <StreakCongratulationsAlert
        visible={showStreakAlert}
        streakCount={stepsData.currentStreak}
        onClose={() => setShowStreakAlert(false)}
      />

      {/* Streak Lost Alert */}
      <StreakLostAlert
        visible={showStreakLostAlert}
        previousStreak={lostStreakCount}
        onClose={() => setShowStreakLostAlert(false)}
      />
    </DynamicBackground>
  );
}
