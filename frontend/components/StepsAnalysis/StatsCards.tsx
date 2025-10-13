import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StepStats } from '../../constants/api';

interface StatsCardsProps {
  serverStats: StepStats | null;
  serverStreak: number;
  serverYesterdaySteps: number;
  yesterdaySteps: { steps: number } | null;
  loadingStats: boolean;
  userWeight?: number; // User's weight in kg
  todaySteps: number; // Today's steps for calories calculation
}

// Calculate calories burned based on steps and weight using scientific MET formula
const calculateCaloriesBurned = (steps: number, weightKg?: number): number => {
  if (!weightKg || steps === 0) return 0;
  
  // Average step length: 0.7m for adults (more accurate than previous estimate)
  const stepLengthM = 0.7;
  const distanceKm = (steps * stepLengthM) / 1000;
  
  // Estimate walking speed based on steps and typical daily activity patterns
  // Most people spread steps over 16 hours (8 hours sleep)
  const activeHours = 16;
  const speedKmh = distanceKm / activeHours;
  
  // MET values based on walking speed (from research data)
  let met = 2.8; // Slow walking baseline
  if (speedKmh >= 6.5) met = 4.3; // Brisk walking (fast pace)
  else if (speedKmh >= 5.0) met = 3.5; // Normal walking pace
  else if (speedKmh >= 3.5) met = 3.0; // Moderate walking
  else if (speedKmh >= 2.0) met = 2.8; // Slow walking
  
  // MET formula: Calories = MET × Weight(kg) × Time(hours)
  // This is the standard formula used by fitness apps like Apple Health, Google Fit
  const calories = met * weightKg * activeHours;
  return Math.round(calories);
};

// Single responsibility: Display statistics cards with server data and calories
export const StatsCards = ({ 
  serverStats, 
  serverStreak, 
  serverYesterdaySteps, 
  yesterdaySteps, 
  loadingStats,
  userWeight,
  todaySteps
}: StatsCardsProps) => {
  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const formatCalories = (calories: number): string => {
    return calories.toLocaleString();
  };

  const statsCards = [
    {
      title: "🔥 Calories Burned",
      value: loadingStats ? '...' : userWeight ? formatCalories(calculateCaloriesBurned(todaySteps, userWeight)) : '--',
      subtitle: userWeight ? `From ${formatSteps(todaySteps)} steps` : 'Weight not set',
      color: "red",
      delay: 1800
    },
    {
      title: "📅 Yesterday", 
      value: loadingStats ? '...' : serverYesterdaySteps > 0 ? formatSteps(serverYesterdaySteps) : (yesterdaySteps ? formatSteps(yesterdaySteps.steps) : '0'),
      subtitle: serverYesterdaySteps > 0 ? (serverYesterdaySteps >= 8000 ? '✅ Goal met' : '❌ Missed goal') : undefined,
      color: "indigo",
      delay: 1950
    },
    {
      title: "📊 Daily Average",
      value: loadingStats ? '...' : serverStats ? formatSteps(Math.round(serverStats.avgSteps)) : '0', 
      subtitle: serverStats && serverStats.totalDays > 0 ? `Last ${serverStats.totalDays} days` : undefined,
      color: "teal",
      delay: 2100
    },
    {
      title: "🏆 Best Day",
      value: loadingStats ? '...' : serverStats ? formatSteps(serverStats.maxSteps) : '0',
      subtitle: serverStats && serverStats.maxSteps > 0 ? 'Personal record' : undefined,
      color: "amber", 
      delay: 2250
    }
  ];

  return (
    <View className="flex-row flex-wrap justify-between mb-6">
      {statsCards.map((card, index) => (
        <Animated.View 
          key={index}
          entering={FadeIn.delay(card.delay).duration(1000)}
          className={`p-5 rounded-2xl w-[48%] mb-4 bg-${card.color}-900/30 items-center border border-${card.color}-500/20`}
        >
          <Text className={`text-${card.color}-300 font-bold mb-2 text-sm`}>
            {card.title}
          </Text>
          <Text className="text-white text-3xl font-black">
            {card.value}
          </Text>
          {card.subtitle && (
            <Text className={`text-${card.color}-300/60 text-xs mt-1`}>
              {card.subtitle}
            </Text>
          )}
        </Animated.View>
      ))}
    </View>
  );
};
