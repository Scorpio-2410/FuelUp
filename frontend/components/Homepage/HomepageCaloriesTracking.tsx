// Homepage calories tracking component  
// Displays calorie burn progress with circular progress indicator
// Ready for future integration with fitness tracking APIs

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface HomepageCaloriesProps {
  className?: string;
  onRefresh?: () => void; // Callback for when calories update
}

const HomepageCaloriesTracking = forwardRef<any, HomepageCaloriesProps>(({ className, onRefresh }, ref) => {
  const [burnedCalories, setBurnedCalories] = useState(400);
  const targetCalories = 1000;

  // Update calories with random value (placeholder for real calorie tracking)
  const updateCalories = () => {
    const newCalories = Math.floor(Math.random() * 600) + 200;
    setBurnedCalories(newCalories);
    onRefresh?.(); // Notify parent component if needed
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateCalories
  }));

  return (
    <View
      className={`p-6 rounded-2xl ${className}`}
      style={{ backgroundColor: "#2a2a2a" }}>
      <View className="flex-row items-center">
        <View className="flex-1 pr-4">
          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: "#bbf246" }}
              />
              <Text className="text-white text-2xl font-semibold">
                {targetCalories} Kcal
              </Text>
            </View>
            <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
              Target
            </Text>
          </View>
          <View>
            <View className="flex-row items-center mb-1">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: "#ff6b35" }}
              />
              <Text className="text-white text-2xl font-semibold">
                {burnedCalories} Kcal
              </Text>
            </View>
            <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
              Burned
            </Text>
          </View>
        </View>
        <View className="relative items-center justify-center">
          <Svg width="160" height="160">
            <Circle cx="80" cy="80" r="62" stroke="#bbf246" strokeWidth="35" fill="transparent" />
            <Circle cx="80" cy="80" r="62" stroke="#ff6b35" strokeWidth="35" fill="transparent" 
                    strokeDasharray="156 233" strokeLinecap="round" transform="rotate(-80 80 80)" />
          </Svg>
        </View>
      </View>
    </View>
  );
});

export default HomepageCaloriesTracking;
