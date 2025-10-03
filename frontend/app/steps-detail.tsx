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

export default function StepsDetail() {
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Step Analytics</Text>
          <TouchableOpacity onPress={refreshSteps}>
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
            <View className="flex-row items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-medium">📊 {stepsData.currentStreak} day streak</Text>
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

          {/* Progress Bar */}
          <Animated.View 
            entering={FadeIn.delay(1000).duration(1000)}
            className="w-full h-3 bg-white bg-opacity-20 rounded-full overflow-hidden mb-4">
            <View 
              className="h-full bg-white rounded-full"
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

          {/* Streak Message - Fixed spacing issue */}
          <Animated.View 
            entering={FadeIn.delay(1400).duration(1000)}
            className="bg-white bg-opacity-10 p-3 rounded-xl">
            <Text className="text-white text-sm font-medium text-center">
              {getStreakMessage()}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Health Guidelines - Modern Card Design */}
        <Animated.View 
          entering={FadeIn.delay(1600).duration(1200)}
          className="p-6 rounded-2xl mb-6"
          style={{
            backgroundColor: "#1F2937",
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8
          }}>
          <Animated.View 
            entering={FadeIn.delay(1800).duration(1000)}
            className="flex-row items-center mb-6">
            <Text className="text-white text-2xl mr-3">💡</Text>
            <Text className="text-white text-xl font-bold">Health Guidelines</Text>
          </Animated.View>
          
          <Animated.Text 
            entering={FadeIn.delay(2000).duration(1000)}
            className={`text-lg font-semibold mb-6 ${getHealthColor()}`}>
            {getHealthGuideline()}
          </Animated.Text>

          <View className="space-y-4">
            <Animated.View 
              entering={FadeIn.delay(2200).duration(1000)}
              className="flex-row items-center bg-green-500 bg-opacity-15 p-4 rounded-2xl border border-green-400 border-opacity-30">
              <View className="w-5 h-5 bg-green-500 rounded-full mr-4 shadow-lg"></View>
              <Text className="text-white text-base font-semibold">7,000+ steps: Healthy baseline</Text>
            </Animated.View>
            
            <Animated.View 
              entering={FadeIn.delay(2400).duration(1000)}
              className="flex-row items-center bg-blue-500 bg-opacity-15 p-4 rounded-2xl border border-blue-400 border-opacity-30">
              <View className="w-5 h-5 bg-blue-500 rounded-full mr-4 shadow-lg"></View>
              <Text className="text-white text-base font-semibold">8,000-12,000: Moderate activity</Text>
            </Animated.View>
            
            <Animated.View 
              entering={FadeIn.delay(2600).duration(1000)}
              className="flex-row items-center bg-purple-500 bg-opacity-15 p-4 rounded-2xl border border-purple-400 border-opacity-30">
              <View className="w-5 h-5 bg-purple-500 rounded-full mr-4 shadow-lg"></View>
              <Text className="text-white text-base font-semibold">10,000: Common benchmark</Text>
            </Animated.View>
            
            <Animated.View 
              entering={FadeIn.delay(2800).duration(1000)}
              className="flex-row items-center bg-yellow-500 bg-opacity-15 p-4 rounded-2xl border border-yellow-400 border-opacity-30">
              <View className="w-5 h-5 bg-yellow-500 rounded-full mr-4 shadow-lg"></View>
              <Text className="text-white text-base font-semibold">12,000-15,000: Higher activity</Text>
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

        {/* Technical Details */}
        <View className="space-y-4">
          <View className="bg-gray-800 p-4 rounded-xl">
            <Text className="text-white font-semibold mb-2">Data Source</Text>
            <Text className="text-gray-300">
              {stepsData.source === 'sensor' ? '📱 Device Sensor' : '💾 Cached Data'}
            </Text>
          </View>

          <View className="bg-gray-800 p-4 rounded-xl">
            <Text className="text-white font-semibold mb-2">Last Updated</Text>
            <Text className="text-gray-300">
              {new Date(stepsData.lastUpdated).toLocaleString()}
            </Text>
          </View>

          <View className="bg-gray-800 p-4 rounded-xl">
            <Text className="text-white font-semibold mb-2">Sensor Status</Text>
            <Text className="text-gray-300">
              {isAvailable ? '✅ Available' : '❌ Unavailable'}
            </Text>
          </View>

          {hasError && (
            <View className="bg-red-900 bg-opacity-50 p-4 rounded-xl">
              <Text className="text-red-200 font-semibold mb-2">❌ Error</Text>
              <Text className="text-red-100">
                Failed to load step data. This could be due to sensor unavailability or network issues. 
                Try refreshing or check your device settings.
              </Text>
            </View>
          )}

          {!isAvailable && !hasError && (
            <View className="bg-yellow-900 bg-opacity-50 p-4 rounded-xl">
              <Text className="text-yellow-200 font-semibold mb-2">⚠️ Note</Text>
              <Text className="text-yellow-100">
                Step counting sensor is not available on this device. 
                Cached data is being displayed.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
