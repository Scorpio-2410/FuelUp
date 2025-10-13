import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getFitnessLevelsData } from '../../constants/StepsData';

interface StepsLevelProps {
  steps: number;
  isLoading: boolean;
  hasError: boolean;
}

// Get progress percentage based on steps (assuming 12,000 is 100%)
const getProgressPercentage = (steps: number): number => {
  return Math.min((steps / 12000) * 100, 100);
};

// Get progress colors using a distinct color gradient from blue to red/orange
// Each fitness level gets a completely different color family
const getProgressColors = (steps: number) => {
  if (steps < 3000) {
    // Getting Started: Blue (0-2,999 steps)
    return {
      background: 'rgba(59, 130, 246, 0.2)',   // Blue
      border: '#3B82F6',                       // Blue border
      text: '#93C5FD'                          // Light blue text
    };
  } else if (steps < 7000) {
    // Building Momentum: Purple (3,000-6,999 steps)
    return {
      background: 'rgba(147, 51, 234, 0.2)',   // Purple
      border: '#9333EA',                       // Purple border
      text: '#C4B5FD'                          // Light purple text
    };
  } else if (steps < 10000) {
    // Healthy Baseline: Green (7,000-9,999 steps)
    return {
      background: 'rgba(34, 197, 94, 0.2)',    // Green
      border: '#22C55E',                       // Green border
      text: '#86EFAC'                          // Light green text
    };
  } else if (steps < 12000) {
    // Active Lifestyle: Orange (10,000-11,999 steps)
    return {
      background: 'rgba(249, 115, 22, 0.2)',   // Orange
      border: '#F97316',                       // Orange border
      text: '#FED7AA'                          // Light orange text
    };
  } else {
    // Athlete Territory: Red (12,000+ steps)
    return {
      background: 'rgba(239, 68, 68, 0.2)',    // Red
      border: '#EF4444',                       // Red border
      text: '#FECACA'                          // Light red text
    };
  }
};

// Hardcoded colors for each specific fitness level card
const getFitnessLevelColors = (activityLevel: string) => {
  switch (activityLevel) {
    case "Getting Started":
      return {
        background: 'rgba(59, 130, 246, 0.2)',   // Blue
        border: '#3B82F6',
        text: '#93C5FD'
      };
    case "Building Momentum":
      return {
        background: 'rgba(34, 197, 94, 0.2)',    // Green (moved from Active Lifestyle)
        border: '#22C55E',
        text: '#86EFAC'
      };
    case "Healthy Baseline":
      return {
        background: 'rgba(147, 51, 234, 0.2)',   // Purple
        border: '#9333EA',
        text: '#C4B5FD'
      };
    case "Active Lifestyle":
      return {
        background: 'rgba(249, 115, 22, 0.2)',   // Orange
        border: '#F97316',
        text: '#FED7AA'
      };
    case "Athlete Territory":
      return {
        background: 'rgba(220, 38, 38, 0.25)',   // Brighter, more red
        border: '#DC2626',                        // Bright red border
        text: '#FECACA'                           // Light red text
      };
    default:
      return {
        background: 'rgba(59, 130, 246, 0.2)',   // Default to blue
        border: '#3B82F6',
        text: '#93C5FD'
      };
  }
};

// Single responsibility: Display step level guidelines with solid hex color backgrounds
export const StepsLevel = ({ steps, isLoading, hasError }: StepsLevelProps) => {
  const [showAllLevels, setShowAllLevels] = useState(false);

  // Get fitness levels data with user's actual steps
  const fitnessLevelsData = getFitnessLevelsData(steps);

  // Find current fitness level based on user's steps
  const getCurrentFitnessLevel = () => {
    for (const level of fitnessLevelsData) {
      if (steps >= level.minSteps && steps <= level.maxSteps) {
        return { ...level, isCurrent: true };
      }
    }
    return { ...fitnessLevelsData[0], isCurrent: true }; // Default to first level
  };

  const currentLevel = getCurrentFitnessLevel();
  const cardColors = getFitnessLevelColors(currentLevel.activityLevel);

  if (isLoading) {
    return (
      <Animated.View entering={FadeIn.delay(600).duration(1000)} className="mt-5 mb-10">
        <View className="p-6 rounded-3xl bg-gray-900">
          <Text className="text-white text-xl font-bold mb-2">💪 Step Levels</Text>
          <Text className="text-blue-300">Loading your step data...</Text>
        </View>
      </Animated.View>
    );
  }

  if (hasError) {
    return (
      <Animated.View entering={FadeIn.delay(600).duration(1000)} className="mt-5 mb-10">
        <View className="p-6 rounded-3xl bg-red-900 border border-red-700">
          <Text className="text-white text-xl font-bold mb-2">💪 Step Levels</Text>
          <Text className="text-red-300">Unable to load step data. Please try refreshing.</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={FadeIn.delay(900).duration(1000)}
      className="mt-6 mb-8"
    >

      {/* Current Level - Soft Transparent Background */}
      <Animated.View 
        entering={FadeIn.delay(600).duration(800)}
        className="p-6 rounded-2xl mb-6"
        style={{
          backgroundColor: cardColors.background,
          borderWidth: 1,
          borderColor: cardColors.border
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">{currentLevel.icon}</Text>
            <View>
              <Text 
                className="text-xl font-bold"
                style={{ color: cardColors.text }}
              >
                {currentLevel.activityLevel}
              </Text>
              <Text className="text-gray-300 text-sm">
                {currentLevel.stepRange} steps
              </Text>
            </View>
          </View>
        </View>
        
        <Text className="text-white text-lg mb-4 leading-relaxed">
          {currentLevel.activityLevel === "Getting Started" 
            ? `You've started moving — that's already a win! Even ${steps.toLocaleString()} steps can help improve circulation and reduce sedentary time. Keep going — every step counts toward a healthier heart.`
            : currentLevel.motivation
          }
        </Text>
        
        <View className="bg-gray-800/50 p-4 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Text className="text-lg mr-2">🧬</Text>
            <Text className="text-gray-300 text-sm font-bold">Scientific Insight</Text>
          </View>
          <Text className="text-gray-200 text-sm leading-relaxed">
            {currentLevel.scientific}
          </Text>
        </View>
      </Animated.View>

      {/* View More Button - Compact Design */}
      <TouchableOpacity
        onPress={() => setShowAllLevels(!showAllLevels)}
        className="mb-6 items-center"
        activeOpacity={0.7}
      >
        <Animated.View 
          entering={FadeIn.delay(700).duration(600)}
          className="bg-gray-900/20 border border-gray-600/30 rounded-full px-6 py-3"
        >
          <Text className="text-gray-200 font-semibold text-sm">
            {showAllLevels ? "Show Less" : "View All Step Levels"}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* All Levels - Solid Hex Backgrounds */}
      {showAllLevels && (
        <View className="space-y-4">
          {fitnessLevelsData
            .filter(level => level.activityLevel !== currentLevel.activityLevel)
            .map((level, index) => {
              const levelColors = getFitnessLevelColors(level.activityLevel);
              
              return (
                <Animated.View 
                  key={index}
                  entering={FadeIn.delay(800 + index * 100).duration(600)}
                  className="p-5 rounded-2xl"
                  style={{
                    backgroundColor: levelColors.background,
                    borderWidth: 1,
                    borderColor: levelColors.border
                  }}
                >
                  <View className="flex-row items-center mb-3">
                    <Text className="text-3xl mr-3">{level.icon}</Text>
                    <View className="flex-1">
                      <Text 
                        className="font-bold text-lg mb-1"
                        style={{ color: levelColors.text }}
                      >
                        {level.activityLevel}
                      </Text>
                      <Text className="text-gray-300 text-sm">
                        {level.stepRange} steps
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-white text-base mb-3 leading-relaxed">
                    {level.motivation}
                  </Text>
                  
                  <View className="bg-gray-800/50 p-3 rounded-lg">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg mr-2">🔬</Text>
                      <Text className="text-gray-300 text-sm font-bold">Scientific Insight</Text>
                    </View>
                    <Text className="text-gray-200 text-sm leading-relaxed">
                      {level.scientific}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
        </View>
      )}
    </Animated.View>
  );
};