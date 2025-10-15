import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from "react-native";
import { apiListMealPlans, apiCreateMealPlan } from "../../constants/api";
import { useRouter } from "expo-router";

export default function MealPlans({ onSelect }: { onSelect?: (planId: number) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanName, setNewPlanName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function loadPlans() {
    try {
      setLoading(true);
      const res = await apiListMealPlans();
      setPlans(res?.plans || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load meal plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleCreatePlan() {
    if (!newPlanName.trim()) {
      Alert.alert("Missing name", "Please enter a name for your meal plan.");
      return;
    }

    try {
      await apiCreateMealPlan(newPlanName.trim());
      setNewPlanName("");
      await loadPlans();
      Alert.alert("Success", "Meal plan created!");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Plan limit reached")) {
        Alert.alert("Limit reached", "You can only have up to 5 meal plans.");
      } else {
        Alert.alert("Error", "Failed to create meal plan.");
      }
    }
  }

  return (
    <View
      style={{
        backgroundColor: "#171717",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#262626",
        padding: 12,
        marginTop: 14,
      }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, marginBottom: 8 }}>
        My Meal Plans
      </Text>

      {/* create new plan */}
      <View style={{ marginBottom: 12 }}>
        <TextInput
          value={newPlanName}
          onChangeText={setNewPlanName}
          placeholder="Enter new meal plan name"
          placeholderTextColor="#9ca3af"
          style={{
            backgroundColor: "#1f2937",
            color: "#fff",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 8,
          }}/>
        <Pressable
          onPress={handleCreatePlan}
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
          }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>➕ Create Plan</Text>
        </Pressable>
      </View>

      {/* list existing plans */}
      {loading ? (
        <ActivityIndicator color="#2563eb" />
      ) : plans.length === 0 ? (
        <Text style={{ color: "#9ca3af" }}>No meal plans yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => router.push(`/meal/plan/${plan.id}`)}
              style={{
                backgroundColor: "#1f2937",
                borderColor: "#374151",
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginRight: 10,
              }}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{plan.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}