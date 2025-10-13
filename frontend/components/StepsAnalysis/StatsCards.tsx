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
}

// Single responsibility: Display statistics cards with server data
export const StatsCards = ({ 
  serverStats, 
  serverStreak, 
  serverYesterdaySteps, 
  yesterdaySteps, 
  loadingStats 
}: StatsCardsProps) => {
  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const statsCards = [
    {
      title: "📅 Yesterday",
      value: loadingStats ? '...' : serverYesterdaySteps > 0 ? formatSteps(serverYesterdaySteps) : (yesterdaySteps ? formatSteps(yesterdaySteps.steps) : '0'),
      subtitle: serverYesterdaySteps > 0 ? (serverYesterdaySteps >= 8000 ? '✅ Goal met' : '❌ Missed goal') : undefined,
      color: "indigo",
      delay: 1800
    },
    {
      title: "📊 Daily Average", 
      value: loadingStats ? '...' : serverStats ? formatSteps(Math.round(serverStats.avgSteps)) : '0',
      subtitle: serverStats && serverStats.totalDays > 0 ? `Last ${serverStats.totalDays} days` : undefined,
      color: "teal",
      delay: 1950
    },
    {
      title: "🏆 Best Day",
      value: loadingStats ? '...' : serverStats ? formatSteps(serverStats.maxSteps) : '0', 
      subtitle: serverStats && serverStats.maxSteps > 0 ? 'Personal record' : undefined,
      color: "amber",
      delay: 2100
    },
    {
      title: "🔥 Current Streak",
      value: loadingStats ? '...' : `${serverStreak} day${serverStreak !== 1 ? 's' : ''}`,
      subtitle: serverStreak > 0 ? 'Keep it up!' : undefined,
      color: "pink", 
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
