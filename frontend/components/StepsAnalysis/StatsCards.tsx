import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StepStats } from '../../constants/api';
import { stepsCaloriesBurn, UserProfile } from './StepsCaloriesBurn';
import { useRouter } from 'expo-router';

interface StatsCardsProps {
  serverStats: StepStats | null;
  serverStreak: number;
  serverYesterdaySteps: number;
  yesterdaySteps: { steps: number } | null;
  loadingStats: boolean;
  userWeight?: number; // User's weight in kg
  userHeight?: number; // User's height in cm
  userAge?: number; // User's age
  userGender?: 'male' | 'female' | 'other'; // User's gender
  userFitnessLevel?: 'beginner' | 'intermediate' | 'advanced'; // User's fitness level
  todaySteps: number; // Today's steps for calories calculation
}

// Calculate calories using the new StepsCaloriesBurn class
const calculateCaloriesBurned = (
  steps: number, 
  userWeight?: number,
  userHeight?: number,
  userAge?: number,
  userGender?: 'male' | 'female' | 'other',
  userFitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
): number => {
  if (!userWeight || steps === 0) return 0;
  
  const userProfile: UserProfile = {
    weightKg: userWeight,
    heightCm: userHeight,
    age: userAge,
    gender: userGender,
    fitnessLevel: userFitnessLevel
  };

  const result = stepsCaloriesBurn.calculateCalories(
    { steps },
    userProfile
  );

  return result.calories;
};

// Helper function to get styles for each card color using inline styles (similar to StepsLevel approach)
const getCardStyles = (color: string) => {
  switch (color) {
    case 'rose':
      return {
        backgroundColor: 'rgba(190, 18, 60, 0.5)',  // rose-900/50 (less transparent)
        borderColor: 'rgba(244, 63, 94, 0.3)',      // rose-500/30 (less transparent)
        titleColor: '#FDA4AF',                       // rose-300
        subtitleColor: 'rgba(253, 164, 175, 0.8)'   // rose-300/80 (less transparent)
      };
    case 'indigo':
      return {
        backgroundColor: 'rgba(49, 46, 129, 0.5)',  // indigo-900/50 (less transparent)
        borderColor: 'rgba(99, 102, 241, 0.3)',     // indigo-500/30 (less transparent)
        titleColor: '#A5B4FC',                       // indigo-300
        subtitleColor: 'rgba(165, 180, 252, 0.8)'   // indigo-300/80 (less transparent)
      };
    case 'teal':
      return {
        backgroundColor: 'rgba(19, 78, 74, 0.5)',   // teal-900/50 (less transparent)
        borderColor: 'rgba(45, 212, 191, 0.3)',     // teal-500/30 (less transparent)
        titleColor: '#5EEAD4',                       // teal-300
        subtitleColor: 'rgba(94, 234, 212, 0.8)'    // teal-300/80 (less transparent)
      };
    case 'amber':
      return {
        backgroundColor: 'rgba(120, 53, 15, 0.5)',  // amber-900/50 (less transparent)
        borderColor: 'rgba(245, 158, 11, 0.3)',     // amber-500/30 (less transparent)
        titleColor: '#FCD34D',                       // amber-300
        subtitleColor: 'rgba(252, 211, 77, 0.8)'    // amber-300/80 (less transparent)
      };
    default:
      return {
        backgroundColor: 'rgba(17, 24, 39, 0.5)',   // gray-900/50 (less transparent)
        borderColor: 'rgba(107, 114, 128, 0.3)',    // gray-500/30 (less transparent)
        titleColor: '#D1D5DB',                       // gray-300
        subtitleColor: 'rgba(209, 213, 219, 0.8)'   // gray-300/80 (less transparent)
      };
  }
};

// Single responsibility: Display statistics cards with server data and calories
export const StatsCards = ({ 
  serverStats, 
  serverStreak, 
  serverYesterdaySteps, 
  yesterdaySteps, 
  loadingStats,
  userWeight,
  userHeight,
  userAge,
  userGender,
  userFitnessLevel,
  todaySteps
}: StatsCardsProps) => {
  const router = useRouter();
  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const formatCalories = (calories: number): string => {
    return calories.toLocaleString();
  };


  const statsCards = [
    {
      title: "🔥 Calories Burned",
      value: loadingStats ? '...' : userWeight ? formatCalories(calculateCaloriesBurned(
        todaySteps, 
        userWeight, 
        userHeight, 
        userAge, 
        userGender, 
        userFitnessLevel
      )) : '--',
      subtitle: userWeight ? `From ${formatSteps(todaySteps)} steps` : 'Weight not set',
      color: "rose",
      delay: 1800
    },
    {
      title: "📅 Yesterday", 
      value: loadingStats ? '...' : (() => {
        // Prioritize server data, but fall back to local data if server data is 0 or unavailable
        const steps = serverYesterdaySteps > 0 ? serverYesterdaySteps : (yesterdaySteps?.steps || 0);
        return formatSteps(steps);
      })(),
      subtitle: (() => {
        const steps = serverYesterdaySteps > 0 ? serverYesterdaySteps : (yesterdaySteps?.steps || 0);
        if (steps > 0) {
          return steps >= 8000 ? '✅ Goal met' : '❌ Missed goal';
        }
        return 'No data available';
      })(),
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
      {statsCards.map((card, index) => {
        const cardStyles = getCardStyles(card.color);
        const isYesterdayCard = card.title === "📅 Yesterday";
        const isCaloriesCard = card.title === "🔥 Calories Burned";
        
        const CardComponent = (isYesterdayCard || isCaloriesCard) ? TouchableOpacity : Animated.View;
        const cardProps = isYesterdayCard 
          ? { onPress: () => router.push('/steps-performance-chart') }
          : isCaloriesCard
          ? { onPress: () => router.push('/calories-formula') }
          : { entering: FadeIn.delay(card.delay).duration(1000) };
        
        return (
          <CardComponent 
            key={index}
            {...cardProps}
            className="p-5 rounded-2xl w-[48%] mb-4 items-center border"
            style={{
              backgroundColor: cardStyles.backgroundColor,
              borderColor: cardStyles.borderColor
            }}
          >
            <Text 
              className="font-black mb-2 text-sm"
              style={{ color: cardStyles.titleColor, fontWeight: '900' }}
            >
              {card.title}
            </Text>
            <Text 
              className="text-3xl"
              style={{ color: cardStyles.titleColor, fontWeight: '900' }}
            >
              {card.value}
            </Text>
            {card.subtitle && (
              <Text 
                className="text-xs mt-1 font-bold"
                style={{ color: cardStyles.subtitleColor, fontWeight: '700' }}
              >
                {card.subtitle}
              </Text>
            )}
          </CardComponent>
        );
      })}
    </View>
  );
};
