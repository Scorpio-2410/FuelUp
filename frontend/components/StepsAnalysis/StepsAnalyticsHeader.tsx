import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Single responsibility: Display the header with back button and title
export const StepsAnalyticsHeader = () => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-3 py-4" style={{ marginBottom: 80 }}>
      <TouchableOpacity onPress={() => router.back()} className="flex-1">
        <Text className="text-white text-lg font-semibold">← Back</Text>
      </TouchableOpacity>
      <Text className="text-white text-xl font-black flex-2 text-center tracking-wide"
        style={{
          textShadowColor: 'rgba(255, 255, 255, 0.2)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}>
        Step Analytics
      </Text>
      <View className="flex-1" />
    </View>
  );
};
