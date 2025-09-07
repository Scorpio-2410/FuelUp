// Homepage steps tracking component
// Displays current step count with placeholder data
// Ready for future integration with step tracking APIs

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';

interface HomepageStepsProps {
  className?: string;
  onRefresh?: () => void; // Callback for when steps update
}

const HomepageSteps = forwardRef<any, HomepageStepsProps>(({ className, onRefresh }, ref) => {
  const [stepCount, setStepCount] = useState(954);

  // Update steps with random value (placeholder for real step tracking)
  const updateSteps = () => {
    const newSteps = Math.floor(Math.random() * 2000) + 500;
    setStepCount(newSteps);
    onRefresh?.(); // Notify parent component if needed
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateSteps
  }));

  return (
    <View
      className={`flex-1 p-4 rounded-2xl ${className}`}
      style={{ backgroundColor: "#c59fc4" }}>
      <Text className="text-black text-xl font-bold mb-1">Steps</Text>
      <Text className="text-black text-3xl font-bold">{stepCount}</Text>
      <Text className="text-black text-sm">Steps</Text>
    </View>
  );
});

export default HomepageSteps;
