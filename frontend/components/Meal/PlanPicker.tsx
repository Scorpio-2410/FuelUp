// frontend/components/Meal/PlanPicker.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
} from "react-native";
import { apiCreateMealPlan, apiListMealPlans } from "../../constants/api";

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
            backgroundColor: "#111827",
            padding: 16,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 10,
            }}>
            Select a plan
          </Text>

          <FlatList
            data={plans}
            keyExtractor={(p) => String(p.id)}
            style={{ maxHeight: 260 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPick(item.id)}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#1f2937",
                }}>
                <Text style={{ color: "#e5e7eb", fontWeight: "600" }}>
                  {item.name}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#9ca3af", marginVertical: 6 }}>
                {loading ? "Loading..." : "No plans yet."}
              </Text>
            }
          />

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

          <Pressable
            onPress={onClose}
            style={{ alignSelf: "flex-end", marginTop: 14 }}>
            <Text style={{ color: "#a3e635", fontWeight: "800" }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
