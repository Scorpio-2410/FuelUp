import { View, Text, SafeAreaView } from "react-native";
import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import { useState } from "react";
import TopSearchBar from "../../components/TopSearchBar";

export default function MealScreen() {
  // Global refresh hook (no custom logic needed for meal tab)
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "meal",
  });
  const [query, setQuery] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <TopSearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
      />
      <View style={{ flex: 1 }}>
        <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-2xl font-bold text-blue-400">Meal</Text>
            <Text className="mt-2 text-neutral-400 text-center">
              Plan and track your meals here.
            </Text>
          </View>
        </RefreshScroll>
      </View>
    </SafeAreaView>
  );
}
