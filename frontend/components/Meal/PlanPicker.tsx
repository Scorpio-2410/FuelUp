// frontend/components/Meal/PlanPicker.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { apiCreateMealPlan, apiListMealPlans, apiDeleteMealPlan, } from "../../constants/api";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (planId: number) => void;
};

export default function PlanPicker({ visible, onClose, onPick }: Props) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [newName, setNewName] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await apiListMealPlans();
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) refresh();
  }, [visible]);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await apiCreateMealPlan(newName.trim());
      setNewName("");
      await refresh();
    } catch {}
  }

  async function handleDelete(id: number, name: string) {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteMealPlan(id);
              await refresh();
            } catch {
              Alert.alert("Error", "Could not delete plan.");
            }
          },
        },
      ]
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}>
        <View
          style={{
            // backgroundColor: "#111827",
            backgroundColor: "#18181b",
            // padding: 16,
            // borderTopLeftRadius: 18,
            // borderTopRightRadius: 18,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 30,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            minHeight: "55%", 
            maxHeight: "75%",
          }}>
            {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "800",
              // marginBottom: 10,
            }}>
            Select a plan
          </Text>
          <Pressable onPress={onClose}>
              <Text style={{ color: "#a3e635", fontWeight: "700", fontSize:15 }}>Close</Text>
            </Pressable>
          </View>

          <FlatList
            data={plans}
            keyExtractor={(p) => String(p.id)}
            style={{ maxHeight: 260, 
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            marginBottom: 14, }}
            contentContainerStyle={{ paddingVertical: 4 }}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#27272a",
                }}
              >
              <Pressable
                onPress={() => onPick(item.id)}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#1f2937",
                }}>
                <Text style={{ color: "#e5e7eb", fontWeight: "600", fontSize:15 }}>
                  {item.name}
                </Text>
              </Pressable>
              <Pressable
                  onPress={() => handleDelete(item.id, item.name)}
                  style={{
                    backgroundColor: "#dc2626",
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Delete</Text>
                </Pressable>
              </View>
            )}
            // ListEmptyComponent={
            //   <Text style={{ color: "#9ca3af", marginVertical: 6, padding: 8, minHeight: 20 }}>
            //     {loading ? "Loading..." : "No plans yet."}
            //   </Text>
            // }
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 50,
                }}>
                <View
                  style={{
                    backgroundColor: "#1f2937",
                    borderRadius: 12,
                    paddingVertical: 20,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: "#2d2d2d",
                    width: "90%",
                    alignItems: "center",
                  }}>
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 15,
                      textAlign: "center",
                      fontWeight: "500",
                    }}>
                    {loading ? "Loading your meal plans..." : "No meal plans yet."}
                  </Text>
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      marginTop: 6,
                      textAlign: "center",
                    }}>
                    Tap “Create” below to start a new plan.
                  </Text>
                </View>
              </View>
            }/>

          <View style={{ height: 12 }} />

          {plans.length < 5 ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="New plan name"
                placeholderTextColor="#9ca3af"
                value={newName}
                onChangeText={setNewName}
                style={{
                  flex: 1,
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              />
              <Pressable
                onPress={handleCreate}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: "#2563eb",
                }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Create</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: "#9ca3af" }}>Plan limit reached (5).</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
