// Homepage steps tracking component
// Uses expo-sensors for real step counting with caching

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useStepsTracking } from '../../hooks/useStepsTracking';

interface HomepageStepsProps {
  className?: string;
  onRefresh?: () => void;
}

const HomepageSteps = forwardRef<any, HomepageStepsProps>(({ className, onRefresh }, ref) => {
  const router = useRouter();
  const { stepsData, isLoading, isAvailable, hasError, updateSteps, refreshSteps } = useStepsTracking();

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateSteps: refreshSteps
  }));

  // Load data on mount and smart refresh when returning to homepage
  useEffect(() => {
    // Load cached data on mount
    if (stepsData.steps === 0 && !isLoading) {
      refreshSteps();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we have cached data and it's older than 15 minutes
      if (!isLoading && stepsData.lastUpdated) {
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
    return formatSteps(stepsData.steps);
  };

  const getDisplayGoal = (): string => {
    if (isLoading) return 'Loading...';
    if (hasError) return 'Unable to load';
    return `daily goal: ${formatSteps(stepsData.goal)}`;
  };

  const getProgressPercentage = (): number => {
    if (!stepsData.goal) return 0;
    return Math.min((stepsData.steps / stepsData.goal) * 100, 100);
  };

  const handlePress = () => {
    router.push('/steps-detail');
  };

  return (
    <TouchableOpacity
      className={`flex-1 p-5 rounded-3xl ${className}`}
      style={{ 
        backgroundColor: "#8B5CF6",
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
      }}
      onPress={handlePress}
      activeOpacity={0.8}>
      
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold mr-2">👟</Text>
          <Text className="text-white text-xl font-bold">Steps</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-white text-sm mr-2">{getSourceIcon()}</Text>
          {isLoading && (
            <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
        </View>
      </View>
      
      <Text className="text-white text-4xl font-black mb-2">
        {getDisplaySteps()}
      </Text>
      
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-sm font-medium">
          {getDisplayGoal()}
        </Text>
        {hasError && (
          <Text className="text-red-200 text-xs font-medium">
            ⚠️ Failed to load
          </Text>
        )}
        {!isAvailable && !isLoading && !hasError && (
          <Text className="text-yellow-200 text-xs font-medium">
            📱 Sensor unavailable
          </Text>
        )}
      </View>

      {/* Modern Progress bar */}
      <View className="w-full h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
        <View 
          className="h-full bg-gradient-to-r from-white to-yellow-200 rounded-full"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </View>
      
      {/* Progress percentage */}
      <Text className="text-white text-xs font-medium mt-2 text-center">
        {Math.round(getProgressPercentage())}% Complete
      </Text>
    </TouchableOpacity>
  );
});

export default HomepageSteps;
