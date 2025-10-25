import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  apiGetExerciseDetail,
  apiGetLocalExerciseDetail,
  getExerciseImageUri,
  apiListPlans,
  apiListPlanExercises,
  apiAddExerciseToPlan,
} from "../../constants/api";
import type { ExerciseListItem } from "./useExerciseAPI";
import PlanPickerModal from "./PlanPickerModal";

const fallback = require("../../assets/images/fitness.png");

type Props = {
  visible: boolean;
  exercise: any | null;
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
  const [exByPlan, setExByPlan] = useState<Record<string | number, any[]>>({});
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !exercise) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setGifUri(null);
        setDetail(null);
        // Determine which id to use for lookups: prefer externalId (plan row) or external_id
        const extId =
          exercise.externalId ?? exercise.external_id ?? exercise.id;
        const source = (exercise.source || "").toLowerCase();
        let item = null;

        if (source === "local" || /^\d+$/.test(String(extId))) {
          // treat as local DB id
          try {
            const r2 = await apiGetLocalExerciseDetail(extId);
            item = r2.item;
            // Prefer local media; if missing, fallback to public image using external_id
            const localMedia = item?.gif_url || item?.image_url || null;
            if (localMedia) setGifUri(localMedia);
            else if (item?.external_id)
              setGifUri(getExerciseImageUri(item.external_id, "180"));
            else setGifUri(null);
          } catch (err) {
            // fallback to public if local fails
            try {
              const r = await apiGetExerciseDetail(extId);
              item = r.item;
              setGifUri(getExerciseImageUri(extId, "180"));
            } catch (err2) {
              throw err2;
            }
          }
        } else {
          // prefer public ExerciseDB lookup first
          try {
            const r = await apiGetExerciseDetail(extId);
            item = r.item;
            setGifUri(getExerciseImageUri(extId, "180"));
          } catch (err) {
            // fallback to local DB detail
            const r2 = await apiGetLocalExerciseDetail(extId);
            item = r2.item;
            setGifUri(item?.gif_url || item?.image_url || null);
          }
        }
        if (!mounted) return;
        setDetail(item || {});
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load exercise");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [visible, exercise]);

  async function openPicker() {
    try {
      const res = await apiListPlans();
      const p = Array.isArray(res?.plans) ? res.plans : [];
      const map: Record<string | number, any[]> = {};
      for (const pl of p) {
        const r = await apiListPlanExercises(pl.id);
        const list = (r as any)?.items ?? (r as any)?.exercises ?? [];
        map[pl.id] = Array.isArray(list) ? list : [];
      }
      setPlans(p);
      setExByPlan(map);
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
      const extId = exercise.externalId ?? exercise.external_id ?? exercise.id;
      await apiAddExerciseToPlan(planId, extId, exercise.name, {
        gifUrl: detail?.gifUrl || null,
        bodyPart: detail?.bodyPart || null,
        target: detail?.target || null,
        equipment: detail?.equipment || null,
      });
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
      {/* We control exact offsets with safe-area insets */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingTop: insets.top + 6, // ⬅️ extra gap under the HUD
          paddingBottom: insets.bottom, // safe bottom
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#222",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ marginRight: 10, padding: 6 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "700",
              flex: 1,
            }}
          >
            {exercise.name}
          </Text>

          <TouchableOpacity
            onPress={openPicker}
            disabled={adding}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: "#15803d",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 8,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 4, fontWeight: "700" }}>
              Plan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content; extra bottom pad so last items clear the home bar */}
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24 + insets.bottom,
          }}
        >
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
            }}
          >
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

          {/* Instructions (fallback to local notes split by newline) */}
          {(() => {
            const steps = Array.isArray(detail?.instructions)
              ? detail.instructions
              : detail?.notes
              ? String(detail.notes)
                  .split(/\r?\n+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];
            return steps.length > 0 ? (
              <>
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  Instructions
                </Text>
                {steps.map((step: string, idx: number) => (
                  <View
                    key={idx}
                    style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#4ade80",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                      }}
                    >
                      <Text style={{ color: "#0a0a0a", fontWeight: "800" }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={{ color: "#d1d5db", flex: 1 }}>{step}</Text>
                  </View>
                ))}
              </>
            ) : null;
          })()}

          {!!toast && (
            <Text style={{ color: "#22c55e", marginTop: 8 }}>{toast}</Text>
          )}
        </ScrollView>
      </View>

      {/* Plan picker (filters out duplicates) */}
      <PlanPickerModal
        visible={pickerOpen}
        plans={plans}
        exByPlan={exByPlan}
        exerciseExternalId={exercise?.id}
        onClose={() => setPickerOpen(false)}
        onPick={handleAddToPlan}
      />
    </Modal>
  );
}
