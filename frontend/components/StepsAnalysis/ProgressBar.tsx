import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number;
  goal: number;
  isLoading: boolean;
  hasError: boolean;
  progressWidth: SharedValue<number>;
}

// Single responsibility: Display animated progress bar with fire gradient
export const ProgressBar = ({ progress, goal, isLoading, hasError, progressWidth }: ProgressBarProps) => {
  const getProgressPercentage = (): number => {
    if (!goal) return 0;
    return Math.min((progress / goal) * 100, 100);
  };

  // Get gradient colors based on progress percentage - Fire theme
  const getGradientColors = (): [string, string, ...string[]] => {
    const progressPercent = getProgressPercentage();
    if (progressPercent < 25) {
      return ['#1E40AF', '#3B82F6']; // Dark blue to blue
    } else if (progressPercent < 50) {
      return ['#1E40AF', '#3B82F6', '#F59E0B']; // Blue to bright yellow
    } else if (progressPercent < 75) {
      return ['#1E40AF', '#3B82F6', '#F59E0B', '#F97316']; // Blue to bright orange
    } else {
      return ['#1E40AF', '#3B82F6', '#F59E0B', '#F97316', '#EF4444']; // Full fire spectrum
    }
  };

  // Get progress percentage text color based on progress level - Fire theme
  const getProgressTextColor = (): string => {
    const progressPercent = getProgressPercentage();
    if (progressPercent < 25) {
      return 'text-blue-400'; // Blue for low progress
    } else if (progressPercent < 50) {
      return 'text-yellow-400'; // Yellow for medium progress
    } else if (progressPercent < 75) {
      return 'text-orange-400'; // Orange for high progress
    } else {
      return 'text-red-400'; // Red for maximum progress
    }
  };

  // Animated style for the progress bar
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  const getRemainingSteps = (): number => {
    return Math.max(0, goal - progress);
  };

  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  return (
    <View className="w-full mb-6">
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-white font-bold text-lg">
          Progress
        </Text>
        <Text className={`${getProgressTextColor()} font-bold text-lg`}>
          {Math.round(getProgressPercentage())}%
        </Text>
      </View>
      <View className="w-full h-4 bg-gray-800 rounded-full relative overflow-hidden" style={{ opacity: 0.6 }}>
        <Animated.View
          style={[
            {
              height: 16,
              borderRadius: 8,
              position: 'absolute',
              left: 0,
              top: 0,
              shadowColor: "#f97316",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
            animatedProgressStyle
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ 
              height: '100%',
              width: '100%',
              borderRadius: 8,
            }}
          />
        </Animated.View>
      </View>
      <Text className="text-gray-400 text-sm font-medium mt-2 px-1">
        {isLoading || hasError ? '...' : `${formatSteps(getRemainingSteps())} steps remaining to reach your goal`}
      </Text>
    </View>
  );
};
