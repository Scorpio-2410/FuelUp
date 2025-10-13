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

// Helper function to get styles for each card color using inline styles (similar to StepsLevel approach)
const getCardStyles = (color: string) => {
  switch (color) {
    case 'rose':
      return {
        backgroundColor: 'rgba(190, 18, 60, 0.3)',  // rose-900/30
        borderColor: 'rgba(244, 63, 94, 0.2)',      // rose-500/20
        titleColor: '#FDA4AF',                       // rose-300
        subtitleColor: 'rgba(253, 164, 175, 0.6)'   // rose-300/60
      };
    case 'indigo':
      return {
        backgroundColor: 'rgba(49, 46, 129, 0.3)',  // indigo-900/30
        borderColor: 'rgba(99, 102, 241, 0.2)',     // indigo-500/20
        titleColor: '#A5B4FC',                       // indigo-300
        subtitleColor: 'rgba(165, 180, 252, 0.6)'   // indigo-300/60
      };
    case 'teal':
      return {
        backgroundColor: 'rgba(19, 78, 74, 0.3)',   // teal-900/30
        borderColor: 'rgba(45, 212, 191, 0.2)',     // teal-500/20
        titleColor: '#5EEAD4',                       // teal-300
        subtitleColor: 'rgba(94, 234, 212, 0.6)'    // teal-300/60
      };
    case 'amber':
      return {
        backgroundColor: 'rgba(120, 53, 15, 0.3)',  // amber-900/30
        borderColor: 'rgba(245, 158, 11, 0.2)',     // amber-500/20
        titleColor: '#FCD34D',                       // amber-300
        subtitleColor: 'rgba(252, 211, 77, 0.6)'    // amber-300/60
      };
    default:
      return {
        backgroundColor: 'rgba(17, 24, 39, 0.3)',   // gray-900/30
        borderColor: 'rgba(107, 114, 128, 0.2)',    // gray-500/20
        titleColor: '#D1D5DB',                       // gray-300
        subtitleColor: 'rgba(209, 213, 219, 0.6)'   // gray-300/60
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
  todaySteps
}: StatsCardsProps) => {
  const formatSteps = (steps: number): string => {
    return steps.toLocaleString();
  };

  const formatCalories = (calories: number): string => {
    return calories.toLocaleString();
  };

  // Debug logging for calories calculation
  React.useEffect(() => {
    console.log('Calories calculation debug:', {
      userWeight,
      todaySteps,
      calculatedCalories: userWeight ? calculateCaloriesBurned(todaySteps, userWeight) : 'No weight'
    });
  }, [userWeight, todaySteps]);

  const statsCards = [
    {
      title: "🔥 Calories Burned",
      value: loadingStats ? '...' : userWeight ? formatCalories(calculateCaloriesBurned(todaySteps, userWeight)) : '--',
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
        return (
          <Animated.View 
            key={index}
            entering={FadeIn.delay(card.delay).duration(1000)}
            className="p-5 rounded-2xl w-[48%] mb-4 items-center border"
            style={{
              backgroundColor: cardStyles.backgroundColor,
              borderColor: cardStyles.borderColor
            }}
          >
            <Text 
              className="font-bold mb-2 text-sm"
              style={{ color: cardStyles.titleColor }}
            >
              {card.title}
            </Text>
            <Text 
              className="text-3xl font-black"
              style={{ color: cardStyles.titleColor }}
            >
              {card.value}
            </Text>
            {card.subtitle && (
              <Text 
                className="text-xs mt-1"
                style={{ color: cardStyles.subtitleColor }}
              >
                {card.subtitle}
              </Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
};
