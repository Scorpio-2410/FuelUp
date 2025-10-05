// Homepage steps tracking component
// Uses expo-sensors for real step counting with caching

import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useStepsTracking } from '../../hooks/useStepsTracking';
import { LinearGradient } from 'expo-linear-gradient';

interface HomepageStepsProps {
  className?: string;
  onRefresh?: () => void;
}

const HomepageSteps = forwardRef<any, HomepageStepsProps>(({ className, onRefresh }, ref) => {
  const router = useRouter();
  const { stepsData, isLoading, isAvailable, hasError, updateSteps, refreshSteps } = useStepsTracking();
  const hasInitiallyRefreshed = useRef(false);

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateSteps: refreshSteps
  }));

  // Load data on mount - always refresh once to ensure fresh data
  useEffect(() => {
    if (!hasInitiallyRefreshed.current && !isLoading) {
      hasInitiallyRefreshed.current = true;
      // Small delay to allow cached data to load first
      const timer = setTimeout(() => {
        refreshSteps();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, refreshSteps]);

  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if data is older than 15 minutes when returning to screen
      if (!isLoading && stepsData.lastUpdated && hasInitiallyRefreshed.current) {
        const lastUpdateTime = new Date(stepsData.lastUpdated).getTime();
        const now = new Date().getTime();
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        if ((now - lastUpdateTime) > fifteenMinutes) {
          refreshSteps();
        }
      }
    }, [refreshSteps, isLoading, stepsData.lastUpdated])
  );

  const getSourceIcon = () => {
    switch (stepsData.source) {
      case 'sensor':
        return '📱';
      case 'cached':
        return '💾';
      default:
        return '👟';
    }
  };

  const formatSteps = (steps: number): string => {
    if (steps >= 1000) {
      return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toString();
  };

  const getDisplaySteps = (): string => {
    if (isLoading) return '...';
    if (hasError) return '--';
    return stepsData.steps.toLocaleString();
  };

  const handlePress = () => {
    router.push('/steps-analytics');
  };

  return (
    <TouchableOpacity
      className={`flex-1 p-5 rounded-3xl bg-purple-600 justify-between ${className}`}
      style={{ 
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
      }}
      onPress={handlePress}
      activeOpacity={0.8}>
      
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold mr-2">👟</Text>
          <Text className="text-white text-xl font-bold">Steps</Text>
        </View>
        {isLoading && (
          <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </View>
      
      <View>
       <Text className="text-white text-4xl font-black">
         {getDisplaySteps()}
       </Text>
       <Text className="text-white/70 text-sm font-medium">
         View Analytics
       </Text>
      </View>
    </TouchableOpacity>
  );
});

export default HomepageSteps;
