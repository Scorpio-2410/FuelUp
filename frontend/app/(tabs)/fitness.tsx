import { useState } from 'react';
import { View, Text } from 'react-native';
import RefreshScroll from "../../components/RefreshScroll";

export default function FitnessScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Simple refresh function - can be expanded later
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View className="flex-1 items-center justify-center px-6 py-20">
          <Text className="text-2xl font-bold text-emerald-400">Fitness</Text>
          <Text className="mt-2 text-neutral-400 text-center">Track workouts and progress here.</Text>
        </View>
      </RefreshScroll>
    </View>
  );
}


