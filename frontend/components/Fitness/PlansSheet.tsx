// components/Fitness/PlansSheet.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  apiListPlans,
  apiCreatePlan,
  apiDeletePlan,
  apiListPlanExercises,
  apiRemoveExerciseFromPlan,
  getExerciseImageUri,
} from "../../constants/api";

const W = Dimensions.get("window").width;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function PlansSheet({ visible, onClose }: Props) {
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [exercises, setExercises] = useState<Record<string, any[]>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const { plans: p } = await apiListPlans();
    setPlans(p || []);
    // prefetch exercises
    const map: Record<string, any[]> = {};
    for (const pl of p || []) {
      const r = await apiListPlanExercises(pl.id);
      map[pl.id] = r?.items || [];
    }
    setExercises(map);
  }

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  async function addPlan() {
    if ((plans || []).length >= 3) return;
    setBusy(true);
    await apiCreatePlan({ name: `Plan ${plans.length + 1}` });
    await load();
    setBusy(false);
  }

  async function removePlan(id: string) {
    setBusy(true);
    await apiDeletePlan(id);
    await load();
    setBusy(false);
  }

  async function removeExercise(planId: string, externalId: string) {
    setBusy(true);
    await apiRemoveExerciseFromPlan(planId, externalId);
    await load();
    setBusy(false);
  }

  const activePlan = useMemo(() => plans[current], [plans, current]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View
          style={{
            marginTop: 56,
            flex: 1,
            backgroundColor: "#0b0b0b",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          }}>
          {/* Top bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#1f2937",
            }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "800",
                flex: 1,
              }}>
              My Plans
            </Text>

            {/* Add / Remove plan */}
            <TouchableOpacity
              onPress={addPlan}
              disabled={busy || plans.length >= 3}
              style={{
                backgroundColor: plans.length >= 3 ? "#111827" : "#22c55e",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                marginRight: 8,
              }}>
              <Ionicons
                name="add"
                color={plans.length >= 3 ? "#6b7280" : "#052e16"}
                size={18}
              />
            </TouchableOpacity>

            {activePlan && (
              <TouchableOpacity
                onPress={() => removePlan(activePlan.id)}
                disabled={busy || plans.length <= 1}
                style={{
                  backgroundColor: plans.length <= 1 ? "#111827" : "#ef4444",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}>
                <Ionicons
                  name="trash"
                  color={plans.length <= 1 ? "#6b7280" : "#0b0b0b"}
                  size={18}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={{ marginLeft: 10 }}>
              <Ionicons name="close" size={22} color="#e5e7eb" />
            </TouchableOpacity>
          </View>

          {/* Pager */}
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / W);
              setCurrent(idx);
            }}
            showsHorizontalScrollIndicator={false}>
            {(plans.length
              ? plans
              : [{ id: "placeholder", name: "Create your first plan" }]
            ).map((p, i) => (
              <View key={p.id || i} style={{ width: W, padding: 16 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "800",
                    fontSize: 16,
                    marginBottom: 10,
                  }}>
                  {p.name}
                </Text>

                {(exercises[p.id] || []).map((ex) => (
                  <View
                    key={ex.externalId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#171717",
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "#262626",
                    }}>
                    <Image
                      source={{
                        uri: getExerciseImageUri(ex.externalId, "180"),
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        marginRight: 10,
                        backgroundColor: "#0a0a0a",
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: "#fff", fontWeight: "700" }}
                        numberOfLines={1}>
                        {ex.name}
                      </Text>
                      {!!ex.bodyPart && (
                        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                          {ex.bodyPart}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => removeExercise(p.id, ex.externalId)}
                      disabled={busy}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: "#ef4444",
                      }}>
                      <Ionicons name="remove" size={16} color="#0b0b0b" />
                    </TouchableOpacity>
                  </View>
                ))}

                {(!exercises[p.id] || exercises[p.id].length === 0) && (
                  <Text style={{ color: "#9CA3AF" }}>
                    No exercises yet. Add from an exercise detail with the green
                    “Plan” button.
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
