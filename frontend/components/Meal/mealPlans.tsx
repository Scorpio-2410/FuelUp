import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  apiListMealPlans,
  apiCreateMealPlan,
  apiGetMealPlanSummary,
} from "../../constants/api";
import { Plus, Utensils, X } from "lucide-react-native";

export default function MealPlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planSummary, setPlanSummary] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);


  async function loadPlans() {
    try {
      setLoading(true);
      const data = await apiListMealPlans();
      setPlans(data.plans || []);
    } catch (e) {
      console.error("Failed to load plans", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePlan() {
    try {
      const name = `Plan ${plans.length + 1}`;
      await apiCreateMealPlan(name);
      await loadPlans();
    } catch (err) {
      console.error("Create plan error:", err);
    }
  }

  async function openPlan(plan: any) {
    try {
      setSelectedPlan(plan);
      setSummaryLoading(true);
      setModalVisible(true);
      const data = await apiGetMealPlanSummary(plan.id);
      setPlanSummary(data);
    } catch (e) {
      console.error("Failed to load plan summary:", e);
    } finally {
      setSummaryLoading(false);
    }
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedPlan(null);
    setPlanSummary(null);
  }

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <View className="flex-1 bg-[#0B0D13] px-5 pt-10">
      {/* header */}
    <View className="flex-row items-center justify-between mb-6 pt-10">
    <Text className="text-white text-3xl font-extrabold">My Meal Plans</Text>
    <Pressable
        onPress={() => router.back()}
        className="bg-green-600 px-3 py-1.5 rounded-lg">
        <Text className="text-white font-semibold">Back</Text>
    </Pressable>
    </View>

      {/* list of plans */}
      {plans.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-base">
            No meal plans yet — create one below!
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id?.toString() ?? item.name}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openPlan(item)}
              className="bg-[#1B1E27] border border-[#2E323F] rounded-2xl mb-4 p-4 flex-row items-center justify-between shadow-md shadow-black/30">
              <View className="flex-row items-center space-x-3">
                <View className="bg-[#2563eb33] p-3 rounded-xl">
                  <Utensils size={22} color="#60A5FA" />
                </View>
                <View>
                  <Text className="text-white text-lg font-semibold">
                    {item.name}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    Created {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-400 text-sm">›</Text>
            </Pressable>
          )}/>
      )}

      {/* create plan button */}
      <Pressable
        onPress={handleCreatePlan}
        className="absolute bottom-10 right-10 mx-auto bg-blue-600 rounded-2xl py-4 w-[90%] flex-row justify-center items-center shadow-lg shadow-blue-800/60">
        <Plus size={22} color="white" />
        <Text className="text-white text-lg font-bold ml-2">Create Plan</Text>
      </Pressable>

      {/* plan recipes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View className="flex-1 bg-black/80 justify-center items-center px-4">
          <View className="bg-[#1B1E27] w-full max-h-[80%] rounded-2xl p-5">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                {selectedPlan?.name || "Meal Plan"}
              </Text>
              <Pressable onPress={closeModal} className="p-1">
                <X size={22} color="#9CA3AF" />
              </Pressable>
            </View>

            {summaryLoading ? (
              <View className="flex-1 justify-center items-center py-10">
                <ActivityIndicator color="#60A5FA" size="large" />
                <Text className="text-gray-400 mt-4">Loading recipes...</Text>
              </View>
            ) : planSummary && planSummary.items?.length > 0 ? (
              <ScrollView className="max-h-[70%]">
                {planSummary.items.map((item: any) => (
                  <View
                    key={item.recipe_id}
                    className="bg-[#252836] border border-[#2E323F] rounded-2xl mb-4 p-4">
                    <View className="flex-row items-center mb-3">
                      <View className="bg-[#2563eb33] p-3 rounded-xl mr-3">
                        <Utensils size={22} color="#60A5FA" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-lg font-semibold">
                          {item.name}
                        </Text>
                        <Text className="text-gray-400 text-sm capitalize">
                          {item.meal_type} • {item.servings} serving
                          {item.servings > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-400">No recipes in this plan yet.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}