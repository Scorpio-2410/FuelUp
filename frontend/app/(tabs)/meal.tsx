import { View, Text } from 'react-native';
import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";

export default function MealScreen() {
  // Global refresh hook (no custom logic needed for meal tab)
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: 'meal'
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View className="flex-1 items-center justify-center px-6 py-20">
          <Text className="text-2xl font-bold text-blue-400">Meal</Text>
          <Text className="mt-2 text-neutral-400 text-center">Plan and track your meals here.</Text>
        </View>
      </RefreshScroll>
    </View>
  );
}


