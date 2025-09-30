import React, { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Plan = { id: number; name: string };

type Props = {
  visible: boolean;
  plans: Plan[];
  // map of planId -> exercises[]
  exByPlan?: Record<string | number, any[]>;
  // the exercise being added
  exerciseExternalId?: string | number;
  onPick: (planId: string) => void;
  onClose: () => void;
};

export default function PlanPickerModal({
  visible,
  plans,
  exByPlan = {},
  exerciseExternalId,
  onPick,
  onClose,
}: Props) {
  const filteredPlans = useMemo(() => {
    if (!exerciseExternalId) return plans;
    const ext = String(exerciseExternalId);
    return (plans || []).filter((p) => {
      const list = exByPlan[p.id] || [];
      return !list.some((row: any) => String(row.externalId) === ext);
    });
  }, [plans, exByPlan, exerciseExternalId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}>
        <View
          style={{
            width: "92%",
            maxWidth: 520,
            backgroundColor: "#0b1220",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#1f2937",
            padding: 14,
          }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}>
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 16,
                flex: 1,
              }}>
              Add to plan
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            {filteredPlans.length === 0 ? (
              <Text style={{ color: "#9ca3af" }}>
                No eligible plans (exercise already exists in your plans).
              </Text>
            ) : (
              filteredPlans.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => onPick(String(p.id))}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: "#0f172a",
                    borderWidth: 1,
                    borderColor: "#1f2937",
                    marginBottom: 10,
                  }}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
