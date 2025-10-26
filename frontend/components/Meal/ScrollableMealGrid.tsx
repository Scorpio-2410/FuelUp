// frontend/components/Meal/ScrollableMealGrid.tsx
import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "./RecipeCard";

type FSRecipeLite = {
  recipe_id: string;
  recipe_name: string;
  recipe_image?: string | null;
};

type ScrollableMealGridProps = {
  items: FSRecipeLite[];
  loading: boolean;
  onRecipePress: (recipeId: string) => void;
  height?: number;
};

export default function ScrollableMealGrid({
  items,
  loading,
  onRecipePress,
  height = 450,
}: ScrollableMealGridProps) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Bounce animation for scroll indicator
  const bounceValue = useSharedValue(0);

  useEffect(() => {
    bounceValue.value = withRepeat(
      withTiming(10, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bounceValue.value }],
    };
  });

  return (
    <View style={{ height, position: "relative", overflow: "hidden" }}>
      {/* Results - Grid Layout */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          const contentHeight = e.nativeEvent.contentSize.height;
          const scrollViewHeight = e.nativeEvent.layoutMeasurement.height;

          // Hide indicator when scrolled or when at bottom
          if (offsetY > 20 || contentHeight <= scrollViewHeight) {
            setShowScrollIndicator(false);
          } else {
            setShowScrollIndicator(true);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Loading Indicator */}
        {loading && (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        {/* Grid of Recipe Cards */}
        {!loading && items.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {items.map((item) => (
                <View
                  key={item.recipe_id}
                  style={{ width: "48%", marginBottom: 14 }}
                >
                  <RecipeCard
                    title={item.recipe_name}
                    imageUrl={item.recipe_image || null}
                    onPress={() => onRecipePress(item.recipe_id)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 40 }}>
            <Text
              style={{
                color: "#9ca3af",
                textAlign: "center",
                fontSize: 16,
              }}
            >
              Search for meals and foods.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Fade Overlay with Scroll Indicator */}
      <LinearGradient
        colors={["transparent", "rgba(0, 0, 0, 0.15)", "rgba(0, 0, 0, 0.08)"]}
        locations={[0, 0.9, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 96,
          pointerEvents: "none",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 16,
        }}
      >
        {/* Scroll Indicator with Bounce Animation */}
        {showScrollIndicator && items.length > 0 && !loading && (
          <Animated.View
            style={[
              bounceStyle,
              {
                backgroundColor: "#1f2937",
                borderRadius: 50,
                padding: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              },
            ]}
          >
            <Ionicons name="chevron-down" size={20} color="#ffffff" />
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}
