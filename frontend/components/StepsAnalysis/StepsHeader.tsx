import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface StepsHeaderProps {
  steps: number;
  goal: number;
  currentStreak: number;
  isLoading: boolean;
  hasError: boolean;
}

// Single responsibility: Display today's steps with streak information
export const StepsHeader = ({ steps, goal, currentStreak, isLoading, hasError }: StepsHeaderProps) => {
  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const getDisplaySteps = (): string => {
    if (isLoading) return '...';
    if (hasError) return '--';
    return formatSteps(steps);
  };

  return (
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
          <Text className="text-purple-300 text-sm font-medium">🔥 {currentStreak} day streak</Text>
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
        {isLoading ? 'Loading...' : hasError ? 'Unable to load' : `Goal: ${formatSteps(goal)}`}
      </Animated.Text>
    </Animated.View>
  );
};
