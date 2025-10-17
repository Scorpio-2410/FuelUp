import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DynamicBackground from '../components/Theme/DynamicTheme';
import { useTheme } from '../contexts/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import { useStepsTracking } from '../hooks/useStepsTracking';
import { WeeklyStepsPerformance } from '../components/StepsAnalysis/WeeklyStepsPerformance';
import { MonthlyStepsPerformance } from '../components/StepsAnalysis/MonthlyStepsPerformance';
import { PeriodType } from '../components/StepsAnalysis/StepsPerformanceTypes';

// Main orchestrator component following SOLID principles
// Single Responsibility: Handle UI layout, period selection, and component coordination
export default function StepsPerformanceChart() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get real-time steps data
  const { stepsData } = useStepsTracking();


  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DynamicBackground theme={theme} intensity="medium">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="flex-row items-center justify-between px-6 py-4"
          >
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-800/50 items-center justify-center"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-bold">Steps Performance</Text>
            
            <View className="w-10" />
          </Animated.View>

        {/* Period Selector */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(300)}
          className="flex-row mx-6 mb-6"
        >
          <TouchableOpacity
            onPress={() => setSelectedPeriod('week')}
            className={`flex-1 py-3 px-4 rounded-l-xl ${
              selectedPeriod === 'week' 
                ? 'bg-orange-500' 
                : 'bg-gray-800/50'
            }`}
          >
            <Text className={`text-center font-bold ${
              selectedPeriod === 'week' ? 'text-white' : 'text-gray-400'
            }`}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedPeriod('month')}
            className={`flex-1 py-3 px-4 rounded-r-xl ${
              selectedPeriod === 'month' 
                ? 'bg-orange-500' 
                : 'bg-gray-800/50'
            }`}
          >
            <Text className={`text-center font-bold ${
              selectedPeriod === 'month' ? 'text-white' : 'text-gray-400'
            }`}>
              Month
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView className="flex-1">
          {/* Render appropriate chart component based on selected period */}
          {selectedPeriod === 'week' ? (
            <WeeklyStepsPerformance currentSteps={stepsData.steps} />
          ) : (
            <MonthlyStepsPerformance 
              currentSteps={stepsData.steps}
              scrollViewRef={scrollViewRef}
            />
          )}
        </ScrollView>
        </SafeAreaView>
      </DynamicBackground>
    </>
  );
}
