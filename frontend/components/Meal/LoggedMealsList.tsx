// frontend/components/Meal/LoggedMealsList.tsx
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGetUserMeals } from "../../constants/api";

type LoggedMeal = {
  id: number;
  name: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  logged_at: string;
};

export type LoggedMealsListRef = {
  refresh: () => void;
};

const LoggedMealsList = forwardRef<LoggedMealsListRef>((props, ref) => {
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const { meals: fetchedMeals, total: totalCount } = await apiGetUserMeals({
        limit: 10,
      });
      setMeals(fetchedMeals);
      setTotal(totalCount);
    } catch (error) {
      console.error("Failed to fetch meals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchMeals,
  }));

  useEffect(() => {
    if (expanded) {
      fetchMeals();
    }
  }, [expanded]);

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case "breakfast":
        return "sunny";
      case "lunch":
        return "restaurant";
      case "dinner":
        return "moon";
      case "snack":
        return "fast-food";
      default:
        return "nutrition";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <View style={{ marginHorizontal: 16, marginTop: 24 }}>
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(26, 26, 26, 0.6)",
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="list" size={20} color="#a3e635" />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            My Logged Meals
          </Text>
          {total > 0 && (
            <View
              style={{
                backgroundColor: "#a3e635",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#000", fontSize: 12, fontWeight: "700" }}>
                {total}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9ca3af"
        />
      </Pressable>

      {/* Meals List */}
      {expanded && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: "rgba(26, 26, 26, 0.6)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            padding: 16,
            maxHeight: 400,
          }}
        >
          {loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color="#a3e635" />
            </View>
          ) : meals.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#9ca3af", textAlign: "center" }}>
                No meals logged yet. Start tracking your meals!
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {meals.map((meal) => (
                <View
                  key={meal.id}
                  style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#374151",
                  }}
                >
                  {/* Meal Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons
                      name={getMealTypeIcon(meal.meal_type) as any}
                      size={18}
                      color="#a3e635"
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {meal.name}
                    </Text>
                  </View>

                  {/* Nutrition Info */}
                  {(meal.calories ||
                    meal.protein_g ||
                    meal.carbs_g ||
                    meal.fat_g) && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      {meal.calories && (
                        <View
                          style={{
                            backgroundColor: "#374151",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#d1d5db", fontSize: 12 }}>
                            {meal.calories} cal
                          </Text>
                        </View>
                      )}
                      {meal.protein_g && (
                        <View
                          style={{
                            backgroundColor: "#374151",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#d1d5db", fontSize: 12 }}>
                            P: {meal.protein_g}g
                          </Text>
                        </View>
                      )}
                      {meal.carbs_g && (
                        <View
                          style={{
                            backgroundColor: "#374151",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#d1d5db", fontSize: 12 }}>
                            C: {meal.carbs_g}g
                          </Text>
                        </View>
                      )}
                      {meal.fat_g && (
                        <View
                          style={{
                            backgroundColor: "#374151",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#d1d5db", fontSize: 12 }}>
                            F: {meal.fat_g}g
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Notes */}
                  {meal.notes && (
                    <Text
                      style={{
                        color: "#9ca3af",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      {meal.notes}
                    </Text>
                  )}

                  {/* Timestamp */}
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>
                    {formatDate(meal.logged_at)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
});

LoggedMealsList.displayName = "LoggedMealsList";

export default LoggedMealsList;
