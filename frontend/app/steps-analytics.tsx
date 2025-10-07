import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import CelestialBackground from '../components/Theme/night/CelestialBackground';
import { useTheme } from '../contexts/ThemeContext';

export default function StepsAnalytics() {
  const router = useRouter();
  const { stepsData, isLoading, isAvailable, hasError, yesterdaySteps, refreshSteps, updateGoal } = useStepsTracking();
  const { theme } = useTheme();

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
    <CelestialBackground
      theme={theme}
      intensity="medium">
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1"
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
        <View className="flex-row items-center justify-between mb-6 px-3 py-4 rounded-2xl bg-gray-900/30">
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
          <TouchableOpacity onPress={refreshSteps} className="flex-1 items-end" activeOpacity={0.7}>
            <Text className="text-white text-xl">🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Main Today Card - Sleek & Focused */}
        <Animated.View 
          entering={FadeIn.delay(150).duration(1000)}
          className="p-6 rounded-3xl mb-4 bg-gray-900"
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
        <Animated.View 
          entering={FadeIn.delay(750).duration(900)} 
          className="w-full mb-6 rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#22D3EE",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5
          }}
        >
          <LinearGradient
            colors={['rgba(17, 24, 39, 0.5)', 'rgba(31, 41, 55, 0.5)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="p-5"
          >
            <View className="flex-row justify-between items-center mb-3 px-1">
              <Text className="text-white font-bold text-lg">
                Progress
              </Text>
              <Text className="text-cyan-400 font-bold text-lg"
                style={{
                  textShadowColor: 'rgba(34, 211, 238, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                {Math.round(getProgressPercentage())}%
              </Text>
            </View>
            <View className="w-full h-4 bg-gray-800/60 rounded-full overflow-hidden">
              <View 
                className="h-4 bg-cyan-400 rounded-full"
                style={{ 
                  width: `${getProgressPercentage()}%`,
                  shadowColor: "#22D3EE",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 10,
                }}
              />
            </View>
            <Text className="text-gray-200 text-sm font-medium mt-3 px-1">
              {isLoading || hasError ? '...' : `${formatSteps(getRemainingSteps())} steps remaining to reach your goal`}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Health Guidelines - Energetic & Modern */}
        <Animated.View 
          entering={FadeIn.delay(900).duration(1000)}
          className="rounded-3xl mb-6 overflow-hidden"
          style={{
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 8
          }}
        >
          <LinearGradient
            colors={['rgba(17, 24, 39, 0.6)', 'rgba(31, 41, 55, 0.6)', 'rgba(17, 24, 39, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            {/* Energetic Header */}
            <Animated.View 
              entering={FadeIn.delay(1050).duration(900)}
              className="mb-6">
              <View className="flex-row items-center justify-center mb-3">
                <Text className="text-3xl mr-3">💪</Text>
                <Text className="text-white text-2xl font-black tracking-wider">FITNESS LEVELS</Text>
                <Text className="text-3xl ml-3">🔥</Text>
              </View>
              <Text className="text-green-400 text-base font-semibold text-center"
                style={{
                  textShadowColor: 'rgba(16, 185, 129, 0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                {getHealthGuideline()}
              </Text>
            </Animated.View>

            {/* Transparent Cards with Color Progression */}
            <View className="space-y-3">
              {/* 7,000+ */}
              <Animated.View 
                entering={FadeIn.delay(1200).duration(900)}
                className="p-5 rounded-xl bg-green-500/15"
                style={{
                  shadowColor: "#10b981",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white text-lg font-bold mb-1">7,000+ STEPS</Text>
                    <Text className="text-green-400 text-sm font-medium">Healthy baseline</Text>
                  </View>
                  <View className="w-3 h-3 bg-green-400 rounded-full" 
                    style={{
                      shadowColor: "#10b981",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }}
                  ></View>
                </View>
              </Animated.View>
              
              {/* 8,000-12,000 */}
              <Animated.View 
                entering={FadeIn.delay(1350).duration(900)}
                className="p-5 rounded-xl bg-blue-500/15"
                style={{
                  shadowColor: "#3b82f6",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white text-lg font-bold mb-1">8,000-12,000 STEPS</Text>
                    <Text className="text-blue-400 text-sm font-medium">Moderate activity</Text>
                  </View>
                  <View className="w-3 h-3 bg-blue-400 rounded-full"
                    style={{
                      shadowColor: "#3b82f6",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }}
                  ></View>
                </View>
              </Animated.View>
              
              {/* 10,000 */}
              <Animated.View 
                entering={FadeIn.delay(1500).duration(900)}
                className="p-5 rounded-xl bg-purple-500/15"
                style={{
                  shadowColor: "#a855f7",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white text-lg font-bold mb-1">10,000 STEPS</Text>
                    <Text className="text-purple-400 text-sm font-medium">Common benchmark</Text>
                  </View>
                  <View className="w-3 h-3 bg-purple-400 rounded-full"
                    style={{
                      shadowColor: "#a855f7",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }}
                  ></View>
                </View>
              </Animated.View>
              
              {/* 12,000-15,000 */}
              <Animated.View 
                entering={FadeIn.delay(1650).duration(900)}
                className="p-5 rounded-xl bg-orange-500/15"
                style={{
                  shadowColor: "#f97316",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white text-lg font-bold mb-1">12,000-15,000 STEPS</Text>
                    <Text className="text-orange-400 text-sm font-medium">Higher activity</Text>
                  </View>
                  <View className="w-3 h-3 bg-orange-400 rounded-full"
                    style={{
                      shadowColor: "#f97316",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 6,
                    }}
                  ></View>
                </View>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards - Modern Design */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Yesterday */}
          <Animated.View 
            entering={FadeIn.delay(1800).duration(1000)}
            className="rounded-2xl w-[48%] mb-4 overflow-hidden"
            style={{
              shadowColor: "#6366f1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6
            }}
          >
            <LinearGradient
              colors={['rgba(79, 70, 229, 0.5)', 'rgba(99, 102, 241, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 items-center"
            >
              <Text className="text-gray-200 font-bold mb-2">📅 Yesterday</Text>
              <Text className="text-white text-3xl font-black"
                style={{
                  textShadowColor: 'rgba(99, 102, 241, 0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                {yesterdaySteps ? formatSteps(yesterdaySteps.steps) : '0'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Daily Average */}
          <Animated.View 
            entering={FadeIn.delay(1950).duration(1000)}
            className="rounded-2xl w-[48%] mb-4 overflow-hidden"
            style={{
              shadowColor: "#14b8a6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6
            }}
          >
            <LinearGradient
              colors={['rgba(20, 184, 166, 0.5)', 'rgba(6, 182, 212, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 items-center"
            >
              <Text className="text-gray-200 font-bold mb-2">📊 Daily Average</Text>
              <Text className="text-white text-3xl font-black"
                style={{
                  textShadowColor: 'rgba(20, 184, 166, 0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                {getDisplaySteps()}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Best Day */}
          <Animated.View 
            entering={FadeIn.delay(2100).duration(1000)}
            className="rounded-2xl w-[48%] overflow-hidden"
            style={{
              shadowColor: "#f59e0b",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6
            }}
          >
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.5)', 'rgba(251, 191, 36, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 items-center"
            >
              <Text className="text-gray-200 font-bold mb-2">🏆 Best Day</Text>
              <Text className="text-white text-3xl font-black"
                style={{
                  textShadowColor: 'rgba(245, 158, 11, 0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                {getDisplaySteps()}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Longest Streak */}
          <Animated.View 
            entering={FadeIn.delay(2250).duration(1000)}
            className="rounded-2xl w-[48%] overflow-hidden"
            style={{
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6
            }}
          >
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.5)', 'rgba(244, 114, 182, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 items-center"
            >
              <Text className="text-gray-200 font-bold mb-2">📈 Longest Streak</Text>
              <Text className="text-white text-3xl font-black"
                style={{
                  textShadowColor: 'rgba(236, 72, 153, 0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                }}>
                0 days
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </CelestialBackground>
  );
}
