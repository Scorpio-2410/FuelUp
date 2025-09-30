// components/Fitness/ExerciseDetailModal.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  apiGetExerciseDetail,
  getExerciseImageUri,
  apiListPlans,
  apiAddExerciseToPlan,
} from "../../constants/api";
import type { ExerciseListItem } from "./useExerciseAPI";
import PlanPickerModal from "./PlanPickerModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const fallback = require("../../assets/images/fitness.png");

type Props = {
  visible: boolean;
  exercise: ExerciseListItem | null;
  onClose: () => void;
};

export default function ExerciseDetailModal({
  visible,
  exercise,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !exercise) return;

    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setGifUri(null);
        setDetail(null);

        const { item } = await apiGetExerciseDetail(exercise.id);
        if (!mounted) return;

        setDetail(item || {});
        setGifUri(getExerciseImageUri(exercise.id, "180"));
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load exercise");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [visible, exercise]);

  async function openPicker() {
    try {
      const res = await apiListPlans();
      setPlans(Array.isArray(res?.plans) ? res.plans : []);
      setPickerOpen(true);
    } catch {
      setToast("Failed to load plans");
      setTimeout(() => setToast(null), 2000);
    }
  }

  async function handleAddToPlan(planId: string) {
    if (!exercise) return;
    try {
      setAdding(true);
      await apiAddExerciseToPlan(planId, exercise.id, exercise.name);
      setPickerOpen(false);
      setToast("Added to plan");
    } catch {
      setToast("Failed to add");
    } finally {
      setAdding(false);
      setTimeout(() => setToast(null), 1500);
    }
  }

  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingTop: insets.top + (Platform.OS === "ios" ? 4 : 0), // ⬅ keep UI clear of notch/Dynamic Island
          paddingBottom: insets.bottom,
        }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#222",
          }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "700",
              flex: 1,
            }}
            numberOfLines={1}>
            {exercise.name}
          </Text>

          {/* Add to plan */}
          <TouchableOpacity
            onPress={openPicker}
            disabled={adding}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: "#15803d",
              flexDirection: "row",
              alignItems: "center",
            }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 2, fontWeight: "700" }}>
              Plan
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40 + insets.bottom, // extra bottom space
          }}>
          {/* GIF / image */}
          <View
            style={{
              width: "100%",
              height: 220,
              backgroundColor: "#111",
              borderRadius: 16,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
            {gifUri ? (
              <Image
                source={{ uri: gifUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : loading ? (
              <ActivityIndicator />
            ) : (
              <Image
                source={fallback}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Meta */}
          {error ? (
            <Text style={{ color: "#ef4444", marginBottom: 12 }}>{error}</Text>
          ) : null}

          <View style={{ gap: 6, marginBottom: 16 }}>
            {!!detail?.bodyPart && (
              <Text style={{ color: "#9CA3AF" }}>
                Body part:{" "}
                <Text style={{ color: "#fff" }}>{detail.bodyPart}</Text>
              </Text>
            )}
            {!!detail?.target && (
              <Text style={{ color: "#9CA3AF" }}>
                Target: <Text style={{ color: "#fff" }}>{detail.target}</Text>
              </Text>
            )}
            {!!detail?.equipment && (
              <Text style={{ color: "#9CA3AF" }}>
                Equipment:{" "}
                <Text style={{ color: "#fff" }}>{detail.equipment}</Text>
              </Text>
            )}
          </View>

          {/* Instructions */}
          {Array.isArray(detail?.instructions) &&
          detail.instructions.length > 0 ? (
            <>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 10,
                }}>
                Instructions
              </Text>
              {detail.instructions.map((step: string, idx: number) => (
                <View
                  key={idx}
                  style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#4ade80",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}>
                    <Text style={{ color: "#0a0a0a", fontWeight: "800" }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={{ color: "#d1d5db", flex: 1 }}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}

          {!!toast && (
            <Text style={{ color: "#22c55e", marginTop: 8 }}>{toast}</Text>
          )}
        </ScrollView>
      </View>

      {/* plan picker */}
      <PlanPickerModal
        visible={pickerOpen}
        plans={plans}
        onClose={() => setPickerOpen(false)}
        onPick={handleAddToPlan}
      />
    </Modal>
  );
}
