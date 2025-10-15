import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiGetMealPlanSummary } from "../../../../constants/api";

export default function MealPlanDetail() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGetMealPlanSummary(Number(planId));
        setPlan(res);
      } catch (err) {
        console.error("Failed to load plan summary", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [planId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f0f" }}>
        <Text style={{ color: "#9ca3af" }}>Failed to load meal plan.</Text>
      </View>
    );
  }

  const recipes = plan?.recipes || plan?.summary?.recipes || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <View style={{ padding: 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#18181b",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            borderColor: "#27272a",
            borderWidth: 1,
            marginBottom: 10,
          }}>
          <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>◀ Back</Text>
        </Pressable>

        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 10 }}>
          {plan?.name || "Meal Plan"}
        </Text>

        {recipes.length === 0 ? (
          <Text style={{ color: "#9ca3af" }}>No recipes in this plan yet.</Text>
        ) : (
          recipes.map((r: any, idx: number) => (
            <Pressable
              key={r.id || idx}
              onPress={() => router.push(`/meal/${r.id}`)}
              style={{
                backgroundColor: "#171717",
                borderColor: "#262626",
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {r.name || r.recipe_name}
              </Text>
              {r.meal_type && (
                <Text style={{ color: "#9ca3af", marginTop: 4 }}>
                  Meal type: {r.meal_type}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}