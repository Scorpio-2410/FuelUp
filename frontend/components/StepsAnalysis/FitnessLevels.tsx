import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface FitnessLevelsProps {
  steps: number;
  isLoading: boolean;
  hasError: boolean;
}

// Single responsibility: Display fitness level guidelines and health information
export const FitnessLevels = ({ steps, isLoading, hasError }: FitnessLevelsProps) => {
  const getHealthGuideline = (): string => {
    if (hasError) return "Unable to load step data. Please try refreshing.";
    if (isLoading) return "Loading your step data...";
    if (steps >= 10000) return "Excellent! You've exceeded the 10K benchmark";
    if (steps >= 7000) return "Great job! You're in the healthy range";
    if (steps >= 5000) return "Good progress! Aim for 7K+ for optimal health";
    return "Keep moving! Every step counts towards better health";
  };

  const fitnessLevels = [
    {
      range: "7,000+ Steps",
      description: "Healthy baseline",
      color: "green",
      delay: 1200
    },
    {
      range: "8,000-12,000 Steps", 
      description: "Moderate activity",
      color: "blue",
      delay: 1350
    },
    {
      range: "10,000 Steps",
      description: "Common benchmark", 
      color: "purple",
      delay: 1500
    },
    {
      range: "8,000+ Steps",
      description: "Higher activity",
      color: "orange", 
      delay: 1650
    }
  ];

  return (
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
        {fitnessLevels.map((level, index) => (
          <Animated.View 
            key={index}
            entering={FadeIn.delay(level.delay).duration(900)}
            className={`p-4 rounded-2xl bg-${level.color}-900/20 border border-${level.color}-500/20`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-base font-bold mb-0.5">{level.range}</Text>
                <Text className={`text-${level.color}-400 text-xs`}>{level.description}</Text>
              </View>
              <View className={`w-2.5 h-2.5 bg-${level.color}-400 rounded-full`}></View>
            </View>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};
