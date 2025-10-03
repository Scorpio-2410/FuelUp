import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useStepsTracking } from '../hooks/useStepsTracking';
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

export default function StepsAnalytics() {
  const router = useRouter();
  const { stepsData, isLoading, isAvailable, hasError, yesterdaySteps, refreshSteps, updateGoal } = useStepsTracking();

  // Auto-refresh when screen loads (like normal apps)
  useEffect(() => {
    refreshSteps();
  }, []); // Only run once when screen loads

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
    <ScrollView 
      className="flex-1 bg-black"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refreshSteps}
          tintColor="#ffffff"
          colors={['#ffffff']}
        />
      }>
      <View className="p-6">
        {/* Header - Fixed Padding */}
        <View className="flex-row items-center justify-between mb-6 px-2">
          <TouchableOpacity onPress={() => router.back()} className="flex-1">
            <Text className="text-white text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-2 text-center">Step Analytics</Text>
          <TouchableOpacity onPress={refreshSteps} className="flex-1 items-end">
            <Text className="text-white text-lg">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Main Today Card - Purple Theme with Smooth Animations */}
        <Animated.View 
          entering={FadeIn.delay(200).duration(1200)}
          className="p-6 rounded-3xl mb-6"
          style={{
            backgroundColor: "#8B5CF6",
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12
          }}>
          
          <Animated.View 
            entering={FadeIn.delay(400).duration(1000)}
            className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center">
              <Text className="text-white text-2xl mr-2">👟</Text>
              <Text className="text-white text-xl font-bold">Today's Steps</Text>
            </View>
            <View className="flex-row items-center bg-purple-500 bg-opacity-30 px-3 py-1 rounded-full border border-purple-300 border-opacity-50">
              <Text className="text-white text-sm font-medium">🔥 {stepsData.currentStreak} day streak</Text>
            </View>
          </Animated.View>

          <Animated.Text 
            entering={FadeIn.delay(600).duration(1200)}
            className="text-7xl font-black mb-3 text-center"
            style={{
              color: '#FFFFFF',
              textShadowColor: '#A855F7',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4
            }}>
            {getDisplaySteps()}
          </Animated.Text>

          <Animated.Text 
            entering={FadeIn.delay(800).duration(1000)}
            className="text-white text-lg mb-4 text-center font-medium">
            {isLoading ? 'Loading...' : hasError ? 'Unable to load' : `steps • Goal: ${(stepsData.goal / 1000).toFixed(1)}K`}
          </Animated.Text>

          {/* Progress Bar - Vibrant Gradient */}
          <Animated.View 
            entering={FadeIn.delay(1000).duration(1000)}
            className="w-full h-4 bg-white bg-opacity-20 rounded-full overflow-hidden mb-4">
            <LinearGradient
              colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-full rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(1200).duration(1000)}
            className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-sm font-medium">
              {isLoading ? 'Loading...' : hasError ? 'Unable to calculate' : `${formatSteps(getRemainingSteps())} steps to goal`}
            </Text>
            <Text className="text-white text-sm font-bold">
              {Math.round(getProgressPercentage())}%
            </Text>
          </Animated.View>

        </Animated.View>

        {/* Health Guidelines - Energetic & Modern */}
        <Animated.View 
          entering={FadeIn.delay(1600).duration(1200)}
          className="p-6 rounded-3xl mb-6"
          style={{
            backgroundColor: "rgba(31, 41, 55, 0.8)",
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12
          }}>
          
          {/* Energetic Header */}
          <Animated.View 
            entering={FadeIn.delay(1800).duration(1000)}
            className="mb-8">
            <View className="flex-row items-center justify-center mb-4">
              <Text className="text-4xl mr-3">💪</Text>
              <Text className="text-white text-3xl font-black">FITNESS LEVELS</Text>
              <Text className="text-4xl ml-3">🔥</Text>
            </View>
            <Text className="text-white text-lg font-semibold text-center opacity-90">
              {getHealthGuideline()}
            </Text>
          </Animated.View>

          {/* Transparent Cards with Color Progression */}
          <View className="space-y-4">
            {/* 7,000+ - Lightest Green */}
            <Animated.View 
              entering={FadeIn.delay(2200).duration(1000)}
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(34, 197, 94, 0.3)"
              }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-black mb-1">7,000+ STEPS</Text>
                  <Text className="text-green-300 text-sm font-medium">Healthy baseline</Text>
                </View>
                <View className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></View>
              </View>
            </Animated.View>
            
            {/* 8,000-12,000 - Medium Blue */}
            <Animated.View 
              entering={FadeIn.delay(2400).duration(1000)}
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.4)"
              }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-black mb-1">8,000-12,000 STEPS</Text>
                  <Text className="text-blue-300 text-sm font-medium">Moderate activity</Text>
                </View>
                <View className="w-3 h-3 bg-blue-400 rounded-full shadow-lg"></View>
              </View>
            </Animated.View>
            
            {/* 10,000 - Darker Purple */}
            <Animated.View 
              entering={FadeIn.delay(2600).duration(1000)}
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.25)",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.5)"
              }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-black mb-1">10,000 STEPS</Text>
                  <Text className="text-purple-300 text-sm font-medium">Common benchmark</Text>
                </View>
                <View className="w-3 h-3 bg-purple-400 rounded-full shadow-lg"></View>
              </View>
            </Animated.View>
            
            {/* 12,000-15,000 - Darkest Orange */}
            <Animated.View 
              entering={FadeIn.delay(2800).duration(1000)}
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.3)",
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.6)"
              }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-black mb-1">12,000-15,000 STEPS</Text>
                  <Text className="text-orange-300 text-sm font-medium">Higher activity</Text>
                </View>
                <View className="w-3 h-3 bg-orange-400 rounded-full shadow-lg"></View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Stats Cards - Smooth Animations */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <Animated.View 
            entering={FadeIn.delay(3000).duration(1200)}
            className="p-5 rounded-2xl w-[48%] mb-4"
            style={{
              backgroundColor: "#374151",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5
            }}>
            <View className="flex-row items-center mb-3">
              <Text className="text-white text-xl mr-2">📅</Text>
              <Text className="text-white font-bold">Yesterday</Text>
            </View>
            <Text className="text-white text-3xl font-black">
              {yesterdaySteps ? formatSteps(yesterdaySteps.steps) : '0'}
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(3200).duration(1200)}
            className="p-5 rounded-2xl w-[48%] mb-4"
            style={{
              backgroundColor: "#374151",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5
            }}>
            <View className="flex-row items-center mb-3">
              <Text className="text-white text-xl mr-2">📊</Text>
              <Text className="text-white font-bold">Daily Average</Text>
            </View>
            <Text className="text-white text-3xl font-black">{getDisplaySteps()}</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(3400).duration(1200)}
            className="p-5 rounded-2xl w-[48%]"
            style={{
              backgroundColor: "#374151",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5
            }}>
            <View className="flex-row items-center mb-3">
              <Text className="text-white text-xl mr-2">🏆</Text>
              <Text className="text-white font-bold">Best Day</Text>
            </View>
            <Text className="text-white text-3xl font-black">{getDisplaySteps()}</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(3600).duration(1200)}
            className="p-5 rounded-2xl w-[48%]"
            style={{
              backgroundColor: "#374151",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5
            }}>
            <View className="flex-row items-center mb-3">
              <Text className="text-white text-xl mr-2">📈</Text>
              <Text className="text-white font-bold">Longest Streak</Text>
            </View>
            <Text className="text-white text-3xl font-black">0 days</Text>
          </Animated.View>
        </View>

      </View>
    </ScrollView>
  );
}
