import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStepsTracking } from '../hooks/useStepsTracking';
import { apiGetStepsChart, apiGetStepsStreak, apiGetStepsByDate, StepStats } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StreakCongratulationsAlert from '../components/Steps/StreakCongratulationsAlert';
import StreakLostAlert from '../components/Steps/StreakLostAlert';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  SlideInUp, 
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicBackground from '../components/Theme/DynamicTheme';
import { useTheme } from '../contexts/ThemeContext';
import RefreshScroll from '../components/RefreshScroll';

export default function StepsAnalytics() {
  const router = useRouter();
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
        console.log('StepsAnalytics: Chart data not available yet (using local data)');
      }

      try {
        const streakData = await apiGetStepsStreak();
        if (streakData.success) {
          setServerStreak(streakData.streakDays);
        }
      } catch (streakError) {
        console.log('StepsAnalytics: Streak data not available yet (using local data)');
      }

      try {
        const yesterdayData = await apiGetStepsByDate(yesterdayStr);
        if (yesterdayData.success && yesterdayData.stepRecord) {
          setServerYesterdaySteps(yesterdayData.stepRecord.stepCount);
        }
      } catch (yesterdayError) {
        console.log('StepsAnalytics: Yesterday data not available (using local data)');
      }
    } catch (error) {
      console.error('StepsAnalytics: Failed to fetch server stats:', error);
      // Don't show error - will use local data as fallback
    } finally {
      setLoadingStats(false);
    }
  };

  // Auto-refresh when screen loads (like normal apps)
  useEffect(() => {
    refreshSteps();
    fetchServerStats();
  }, []); // Only run once when screen loads

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
        console.error('StepsAnalytics: Error checking streak achievement:', error);
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
        console.error('StepsAnalytics: Error checking streak loss:', error);
      }
    };

    checkStreakLoss();
  }, [stepsData.currentStreak, isLoading]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.all([refreshSteps(), fetchServerStats()]);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const getProgressPercentage = (): number => {
    if (!stepsData.goal) return 0;
    return Math.min((stepsData.steps / stepsData.goal) * 100, 100);
  };

  const getRemainingSteps = (): number => {
    return Math.max(0, stepsData.goal - stepsData.steps);
  };

  const getDisplaySteps = (): string => {
    if (isLoading) return '...';
    if (hasError) return '--';
    return formatSteps(stepsData.steps);
  };

  const getStreakMessage = (): string => {
    if (isLoading) return "Loading streak info...";
    if (hasError) return "Unable to load streak.";
    
    const remaining = stepsData.streakGoal - stepsData.steps;
    
    if (stepsData.steps >= stepsData.streakGoal) {
      return `Amazing! You've hit ${formatSteps(stepsData.steps)} steps today. Your streak continues! 🔥`;
    } else if (remaining > 0) {
      return `You're only ${formatSteps(remaining)} steps away from your ${formatSteps(stepsData.streakGoal)} goal—stay on track and your streak continues!`;
    } else {
      return "Keep moving! Hit 7,000 steps today to keep your streak alive.";
    }
  };

  const getHealthGuideline = (): string => {
    if (hasError) return "Unable to load step data. Please try refreshing.";
    if (isLoading) return "Loading your step data...";
    if (stepsData.steps >= 10000) return "Excellent! You've exceeded the 10K benchmark";
    if (stepsData.steps >= 7000) return "Great job! You're in the healthy range";
    if (stepsData.steps >= 5000) return "Good progress! Aim for 7K+ for optimal health";
    return "Keep moving! Every step counts towards better health";
  };

  const getHealthColor = (): string => {
    if (stepsData.steps >= 10000) return "text-green-600";
    if (stepsData.steps >= 7000) return "text-blue-600";
    if (stepsData.steps >= 5000) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <DynamicBackground
      theme={theme}
      intensity="medium">
      <SafeAreaView className="flex-1">
        <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
          <View className="p-6">
        {/* Header - Fixed Padding */}
        <View className="flex-row items-center justify-between px-3 py-4" style={{ marginBottom: 80 }}>
          <TouchableOpacity onPress={() => router.back()} className="flex-1">
            <Text className="text-white text-lg font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-black flex-2 text-center tracking-wide"
            style={{
              textShadowColor: 'rgba(255, 255, 255, 0.2)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
            Step Analytics
          </Text>
          <View className="flex-1" />
        </View>

        {/* Main Today Card - Sleek & Focused */}
        <Animated.View 
          entering={FadeIn.delay(150).duration(1000)}
          className="p-6 rounded-3xl mb-10 bg-gray-900/70"
        >
          <Animated.View 
            entering={FadeIn.delay(300).duration(900)}
            className="flex-row justify-between items-center mb-4"
          >
            <View className="flex-row items-center">
              <Text className="text-white text-2xl mr-2">👟</Text>
              <Text className="text-white text-xl font-bold">Today's Steps</Text>
            </View>
            <View className="flex-row items-center bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/50">
              <Text className="text-purple-300 text-sm font-medium">🔥 {stepsData.currentStreak} day streak</Text>
            </View>
          </Animated.View>

          <Animated.Text 
            entering={FadeIn.delay(450).duration(1000)}
            className="text-7xl font-black text-white mb-2 text-center"
          >
            {getDisplaySteps()}
          </Animated.Text>

          <Animated.Text 
            entering={FadeIn.delay(600).duration(900)}
            className="text-gray-400 text-lg text-center font-medium"
          >
            {isLoading ? 'Loading...' : hasError ? 'Unable to load' : `Goal: ${formatSteps(stepsData.goal)}`}
          </Animated.Text>
        </Animated.View>

        {/* Progress Bar - High Contrast & Clear */}
        <Animated.View entering={FadeIn.delay(750).duration(900)} className="w-full mb-6">
          <View className="flex-row justify-between items-center mb- px-1">
            <Text className="text-white font-bold text-lg">
              Progress
            </Text>
            <Text className="text-orange-400 font-bold text-lg">
              {Math.round(getProgressPercentage())}%
            </Text>
          </View>
          <View className="w-full h-4 bg-gray-800 rounded-full relative overflow-hidden" style={{ opacity: 0.6 }}>
            <LinearGradient
              colors={['#1E3A8A', '#3B82F6', '#F97316', "#fb923c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-4 rounded-full absolute left-0 top-0"
              style={{ 
                width: `${getProgressPercentage()}%`,
                shadowColor: "#f97316",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
              }}
            />
          </View>
          <Text className="text-gray-400 text-sm font-medium mt-2 px-1">
            {isLoading || hasError ? '...' : `${formatSteps(getRemainingSteps())} steps remaining to reach your goal`}
          </Text>
        </Animated.View>

        {/* Health Guidelines - Energetic & Modern */}
        <Animated.View 
          entering={FadeIn.delay(900).duration(1000)}
          className="mt-5 mb-10"
        >
          {/* Energetic Header */}
          <Animated.View 
            entering={FadeIn.delay(1050).duration(900)}
            className="mb-5">
            <View className="flex-row items-center justify-center mb-2">
              <Text className="text-2xl mr-2">💪</Text>
              <Text className="text-white text-lg font-bold tracking-wide">Fitness Levels</Text>
              <Text className="text-2xl ml-2">🔥</Text>
            </View>
            <Text className="text-gray-300 text-sm font-medium text-center">
              {getHealthGuideline()}
            </Text>
          </Animated.View>

          {/* Transparent Cards with Color Progression */}
          <View className="space-y-3">
              {/* 7,000+ */}
              <Animated.View 
                entering={FadeIn.delay(1200).duration(900)}
                className="p-4 rounded-2xl bg-green-900/20 border border-green-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold mb-0.5">7,000+ Steps</Text>
                    <Text className="text-green-400 text-xs">Healthy baseline</Text>
                  </View>
                  <View className="w-2.5 h-2.5 bg-green-400 rounded-full"></View>
                </View>
              </Animated.View>
              
              {/* 8,000-12,000 */}
              <Animated.View 
                entering={FadeIn.delay(1350).duration(900)}
                className="p-4 rounded-2xl bg-blue-900/20 border border-blue-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold mb-0.5">8,000-12,000 Steps</Text>
                    <Text className="text-blue-400 text-xs">Moderate activity</Text>
                  </View>
                  <View className="w-2.5 h-2.5 bg-blue-400 rounded-full"></View>
                </View>
              </Animated.View>
              
              {/* 10,000 */}
              <Animated.View 
                entering={FadeIn.delay(1500).duration(900)}
                className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold mb-0.5">10,000 Steps</Text>
                    <Text className="text-purple-400 text-xs">Common benchmark</Text>
                  </View>
                  <View className="w-2.5 h-2.5 bg-purple-400 rounded-full"></View>
                </View>
              </Animated.View>
              
              {/* 12,000-15,000 */}
              <Animated.View 
                entering={FadeIn.delay(1650).duration(900)}
                className="p-4 rounded-2xl bg-orange-900/20 border border-orange-500/20"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold mb-0.5">8,000+ Steps</Text>
                    <Text className="text-orange-400 text-xs">Higher activity</Text>
                  </View>
                  <View className="w-2.5 h-2.5 bg-orange-400 rounded-full"></View>
                </View>
              </Animated.View>
            </View>
        </Animated.View>

        {/* Stats Cards - Modern Design */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Yesterday */}
          <Animated.View 
            entering={FadeIn.delay(1800).duration(1000)}
            className="p-5 rounded-2xl w-[48%] mb-4 bg-indigo-900/30 items-center border border-indigo-500/20"
          >
            <Text className="text-indigo-300 font-bold mb-2 text-sm">📅 Yesterday</Text>
            <Text className="text-white text-3xl font-black">
              {loadingStats ? '...' : serverYesterdaySteps > 0 ? formatSteps(serverYesterdaySteps) : (yesterdaySteps ? formatSteps(yesterdaySteps.steps) : '0')}
            </Text>
            {serverYesterdaySteps > 0 && (
              <Text className="text-indigo-300/60 text-xs mt-1">
                {serverYesterdaySteps >= 8000 ? '✅ Goal met' : '❌ Missed goal'}
              </Text>
            )}
          </Animated.View>

          {/* Daily Average */}
          <Animated.View 
            entering={FadeIn.delay(1950).duration(1000)}
            className="p-5 rounded-2xl w-[48%] mb-4 bg-teal-900/30 items-center border border-teal-500/20"
          >
            <Text className="text-teal-300 font-bold mb-2 text-sm">📊 Daily Average</Text>
            <Text className="text-white text-3xl font-black">
              {loadingStats ? '...' : serverStats ? formatSteps(Math.round(serverStats.avgSteps)) : '0'}
            </Text>
            {serverStats && serverStats.totalDays > 0 && (
              <Text className="text-teal-300/60 text-xs mt-1">
                Last {serverStats.totalDays} days
              </Text>
            )}
          </Animated.View>

          {/* Best Day */}
          <Animated.View 
            entering={FadeIn.delay(2100).duration(1000)}
            className="p-5 rounded-2xl w-[48%] bg-amber-900/30 items-center border border-amber-500/20"
          >
            <Text className="text-amber-300 font-bold mb-2 text-sm">🏆 Best Day</Text>
            <Text className="text-white text-3xl font-black">
              {loadingStats ? '...' : serverStats ? formatSteps(serverStats.maxSteps) : '0'}
            </Text>
            {serverStats && serverStats.maxSteps > 0 && (
              <Text className="text-amber-300/60 text-xs mt-1">
                Personal record
              </Text>
            )}
          </Animated.View>

          {/* Current Streak */}
          <Animated.View 
            entering={FadeIn.delay(2250).duration(1000)}
            className="p-5 rounded-2xl w-[48%] bg-pink-900/30 items-center border border-pink-500/20"
          >
            <Text className="text-pink-300 font-bold mb-2 text-sm">🔥 Current Streak</Text>
            <Text className="text-white text-3xl font-black">
              {loadingStats ? '...' : `${serverStreak} day${serverStreak !== 1 ? 's' : ''}`}
            </Text>
            {serverStreak > 0 && (
              <Text className="text-pink-300/60 text-xs mt-1">
                Keep it up!
              </Text>
            )}
          </Animated.View>
        </View>

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
