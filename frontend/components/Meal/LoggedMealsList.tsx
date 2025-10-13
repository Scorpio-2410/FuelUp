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

// Meal Card Component
const MealCard = ({
  meal,
  timeOnly,
}: {
  meal: LoggedMeal;
  timeOnly?: boolean;
}) => {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View
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
      {(meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g) && (
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
        {timeOnly ? formatTime(meal.logged_at) : formatFullDate(meal.logged_at)}
      </Text>
    </View>
  );
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

  const getTimeCategory = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mealDate = new Date(date);
    mealDate.setHours(0, 0, 0, 0);

    if (mealDate.getTime() === today.getTime()) {
      return "today";
    } else if (mealDate.getTime() === yesterday.getTime()) {
      return "yesterday";
    } else if (mealDate >= threeDaysAgo) {
      return "past3days";
    } else if (mealDate >= sevenDaysAgo) {
      return "pastWeek";
    } else {
      return "older";
    }
  };

  const groupMealsByTime = () => {
    const groups: {
      today: LoggedMeal[];
      yesterday: LoggedMeal[];
      past3days: LoggedMeal[];
      pastWeek: LoggedMeal[];
      older: LoggedMeal[];
    } = {
      today: [],
      yesterday: [],
      past3days: [],
      pastWeek: [],
      older: [],
    };

    meals.forEach((meal) => {
      const category = getTimeCategory(meal.logged_at);
      groups[category].push(meal);
    });

    return groups;
  };

  const groupedMeals = groupMealsByTime();

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
              {/* Today */}
              {groupedMeals.today.length > 0 && (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="today" size={16} color="#a3e635" />
                    <Text
                      style={{
                        color: "#a3e635",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Today
                    </Text>
                  </View>
                  {groupedMeals.today.map((meal) => (
                    <MealCard key={meal.id} meal={meal} timeOnly />
                  ))}
                </View>
              )}

              {/* Yesterday */}
              {groupedMeals.yesterday.length > 0 && (
                <View
                  style={{ marginTop: groupedMeals.today.length > 0 ? 16 : 0 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="calendar" size={16} color="#d1d5db" />
                    <Text
                      style={{
                        color: "#d1d5db",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Yesterday
                    </Text>
                  </View>
                  {groupedMeals.yesterday.map((meal) => (
                    <MealCard key={meal.id} meal={meal} timeOnly />
                  ))}
                </View>
              )}

              {/* Past 3 Days */}
              {groupedMeals.past3days.length > 0 && (
                <View
                  style={{
                    marginTop:
                      groupedMeals.today.length > 0 ||
                      groupedMeals.yesterday.length > 0
                        ? 16
                        : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="time" size={16} color="#9ca3af" />
                    <Text
                      style={{
                        color: "#9ca3af",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Past 3 Days
                    </Text>
                  </View>
                  {groupedMeals.past3days.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </View>
              )}

              {/* Past Week */}
              {groupedMeals.pastWeek.length > 0 && (
                <View
                  style={{
                    marginTop:
                      groupedMeals.today.length > 0 ||
                      groupedMeals.yesterday.length > 0 ||
                      groupedMeals.past3days.length > 0
                        ? 16
                        : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        color: "#6b7280",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Past Week
                    </Text>
                  </View>
                  {groupedMeals.pastWeek.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </View>
              )}

              {/* Older */}
              {groupedMeals.older.length > 0 && (
                <View
                  style={{
                    marginTop:
                      groupedMeals.today.length > 0 ||
                      groupedMeals.yesterday.length > 0 ||
                      groupedMeals.past3days.length > 0 ||
                      groupedMeals.pastWeek.length > 0
                        ? 16
                        : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <Ionicons name="archive" size={16} color="#4b5563" />
                    <Text
                      style={{
                        color: "#4b5563",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Older
                    </Text>
                  </View>
                  {groupedMeals.older.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
});

LoggedMealsList.displayName = "LoggedMealsList";

export default LoggedMealsList;
