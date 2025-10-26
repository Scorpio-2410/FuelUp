import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import FitnessStep, { Fitness } from "../Onboarding/FitnessStep";
import {
  apiGetFitnessProfile,
  apiUpsertFitnessProfile,
  apiPlanAndScheduleAi,
} from "../../constants/api";

interface FitnessProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const defaultFitness: Fitness = {
  goal: "general_health",
  activityLevel: "moderate",
  daysPerWeek: "3",
  height: "170",
  weight: "70",
  heightUnit: "cm",
  weightUnit: "kg",
};

// Map backend fitness profile to Fitness shape
const toFitness = (p: any): Fitness => ({
  goal: p?.goal ?? "general_health",
  activityLevel: p?.activityLevel ?? "moderate",
  daysPerWeek: p?.daysPerWeek ? String(p.daysPerWeek) : "3",
  height: p?.heightCm ? String(p.heightCm) : "170",
  weight: p?.weightKg ? String(p.weightKg) : "70",
  heightUnit: "cm",
  weightUnit: "kg",
});

function DiscardButton({
  onDiscard,
  disabled,
}: {
  onDiscard: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onDiscard}
      disabled={disabled}
      className="rounded-2xl py-4 bg-red-500/80 border border-red-400/30"
      style={{
        flexBasis: "48%",
        flexGrow: 1,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel="Discard changes"
    >
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-lg">❌</Text>
        <Text className="text-white text-center font-bold text-base">
          Discard Changes
        </Text>
      </View>
    </Pressable>
  );
}

function SaveButton({
  onSave,
  saving,
}: {
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Pressable
      onPress={onSave}
      disabled={saving}
      className={`rounded-2xl py-4 ${
        saving ? "bg-emerald-500/80" : "bg-emerald-500"
      }`}
      style={{
        flexBasis: "48%",
        flexGrow: 1,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: saving ? 0.3 : 0.5,
        shadowRadius: 8,
        elevation: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel="Save fitness profile"
    >
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-lg">{saving ? "⏳" : "💾"}</Text>
        <Text className="text-white text-center font-bold text-base">
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function FitnessProfile({
  visible,
  onClose,
}: FitnessProfileModalProps) {
  const [fitness, setFitness] = useState<Fitness>(defaultFitness);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialFitness, setInitialFitness] = useState<Fitness>(defaultFitness);
  const [showWorkoutUpdatePrompt, setShowWorkoutUpdatePrompt] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [workoutTime, setWorkoutTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  // Persist user unit preferences between openings
  const K_UNIT_HEIGHT = "fu_pref_height_unit";
  const K_UNIT_WEIGHT = "fu_pref_weight_unit";

  // Local converters to apply preferred display units on load
  const cmToFtInLabel = (cm: number): string => {
    if (!cm || isNaN(cm as any)) return "";
    const totalInches = Math.round(Number(cm) / 2.54);
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return `${ft}'${inch}`;
  };
  const kgToLb = (kg: number | string): string => {
    const n = Number(kg);
    if (!n || isNaN(n)) return "";
    return String(Math.round(n / 0.45359237));
  };

  const hasUnsavedChanges =
    JSON.stringify(fitness) !== JSON.stringify(initialFitness);

  // Fetch fitness profile from backend when modal opens
  useEffect(() => {
    let mounted = true;
    if (visible) {
      setLoading(true);
      (async () => {
        try {
          const { profile } = await apiGetFitnessProfile();
          if (mounted && profile) {
            const loadedFitness = { ...defaultFitness, ...toFitness(profile) };
            // Apply preferred unit display from storage if available
            try {
              const [prefH, prefW] = await Promise.all([
                AsyncStorage.getItem(K_UNIT_HEIGHT),
                AsyncStorage.getItem(K_UNIT_WEIGHT),
              ]);
              console.log("[FitnessProfile] Loaded unit prefs:", {
                prefH,
                prefW,
              });
              let show = { ...loadedFitness };
              if (prefH === "ft") {
                show.heightUnit = "ft";
                const converted = cmToFtInLabel(Number(loadedFitness.height));
                console.log(
                  "[FitnessProfile] Converting height cm to ft:",
                  loadedFitness.height,
                  "→",
                  converted
                );
                show.height = converted;
              }
              if (prefW === "lb") {
                show.weightUnit = "lb";
                const converted = kgToLb(loadedFitness.weight || "");
                console.log(
                  "[FitnessProfile] Converting weight kg to lb:",
                  loadedFitness.weight,
                  "→",
                  converted
                );
                show.weight = converted;
              }
              console.log("[FitnessProfile] Final display units:", {
                heightUnit: show.heightUnit,
                weightUnit: show.weightUnit,
              });
              setFitness(show);
              setInitialFitness(show);
            } catch (e) {
              console.warn("[FitnessProfile] Error applying unit prefs:", e);
              setFitness(loadedFitness);
              setInitialFitness(loadedFitness);
            }
          } else if (mounted) {
            setFitness(defaultFitness);
            setInitialFitness(defaultFitness);
          }
        } catch {
          if (mounted) {
            setFitness(defaultFitness);
            setInitialFitness(defaultFitness);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      // Local helpers to normalize to metric for storage
      const toKg = (val: string, unit: "kg" | "lb") => {
        const n = Number(val);
        if (!n || isNaN(n)) return NaN;
        return unit === "kg" ? Math.round(n) : Math.round(n * 0.45359237);
      };
      const parseFtInchesToCm = (raw: string): number => {
        const s = String(raw).trim();
        if (!s) return NaN;
        let feet = NaN;
        let inches = 0;
        const two = s.match(/(\d+)\D+(\d+)/);
        if (two) {
          feet = parseInt(two[1], 10);
          inches = parseInt(two[2], 10);
        } else {
          const one = s.match(/(\d+)/);
          if (one) feet = parseInt(one[1], 10);
        }
        if (Number.isNaN(feet)) return NaN;
        if (inches < 0 || inches > 11)
          inches = Math.max(0, Math.min(11, inches));
        const cm = (feet * 12 + inches) * 2.54;
        return Math.round(cm);
      };

      // Convert height/weight to numbers for backend
      const heightCm =
        (fitness.heightUnit as "cm" | "ft") === "cm"
          ? Number(fitness.height)
          : parseFtInchesToCm(String(fitness.height || ""));
      const weightKg = toKg(
        String(fitness.weight || ""),
        (fitness.weightUnit as "kg" | "lb") || "kg"
      );

      const payload = {
        goal: fitness.goal ?? null,
        activityLevel: fitness.activityLevel ?? null,
        daysPerWeek: fitness.daysPerWeek ? Number(fitness.daysPerWeek) : null,
        heightCm: Number.isNaN(heightCm) ? null : heightCm,
        weightKg: Number.isNaN(weightKg) ? null : weightKg,
      };

      // Check if key fitness drivers changed (days, goal, activity level)
      const daysChanged = initialFitness.daysPerWeek !== fitness.daysPerWeek;
      const goalChanged = initialFitness.goal !== fitness.goal;
      const activityChanged =
        (initialFitness.activityLevel || "").toLowerCase() !==
        (fitness.activityLevel || "").toLowerCase();
      const fitnessChanged = daysChanged || goalChanged || activityChanged;

      await apiUpsertFitnessProfile(payload);
      setInitialFitness(fitness);

      // Persist unit preferences when user saves
      try {
        console.log("[FitnessProfile] Saving unit prefs:", {
          heightUnit: fitness.heightUnit || "cm",
          weightUnit: fitness.weightUnit || "kg",
        });
        await AsyncStorage.setItem(K_UNIT_HEIGHT, fitness.heightUnit || "cm");
        await AsyncStorage.setItem(K_UNIT_WEIGHT, fitness.weightUnit || "kg");
      } catch (e) {
        console.warn("[FitnessProfile] Failed to save unit prefs:", e);
      }

      // Show prompt if fitness-related settings changed
      if (fitnessChanged) {
        setSaving(false);
        Alert.alert(
          "Fitness Preferences Updated",
          "You've changed your fitness preferences. Would you like us to adjust your workout plan and workout times to match your new profile?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => onClose(),
            },
            {
              text: "Yes",
              onPress: () => {
                setShowWorkoutUpdatePrompt(true);
              },
            },
          ]
        );
      } else {
        setSaving(false);
        onClose();
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Save failed", e?.message || "Please try again.");
    }
  };

  const handleUpdateWorkoutSchedule = async () => {
    setShowTimePicker(false);
    setShowWorkoutUpdatePrompt(false);
    setUpdatingSchedule(true);

    try {
      const workoutHour = workoutTime.getHours();
      const workoutMinute = workoutTime.getMinutes();

      // Call the AI plan generation with force_ai to regenerate
      const result = await apiPlanAndScheduleAi({
        force_ai: true,
        workoutHour,
        workoutMinute,
      });

      const created_count = result?.created_count ?? 0;

      if (created_count > 0) {
        Alert.alert(
          "Workout Schedule Updated",
          `Successfully created ${created_count} new workout${
            created_count > 1 ? "s" : ""
          } based on your updated preferences.`,
          [{ text: "OK", onPress: () => onClose() }]
        );
      } else {
        Alert.alert(
          "Update Complete",
          "Your preferences have been saved, but no new workouts were scheduled.",
          [{ text: "OK", onPress: () => onClose() }]
        );
      }
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Please try again.");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  // Close handler with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges && !saving) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Would you like to save them before closing?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: onClose,
          },
          {
            text: "Save",
            onPress: handleSave,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Fitness Profile</Text>
            <Pressable style={styles.closeBtnInline} onPress={handleClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#8B5CF6"
              style={{ marginTop: 32 }}
            />
          ) : (
            <>
              <FitnessStep value={fitness} onChange={setFitness} />
              <View
                className="gap-3"
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingBottom: 128,
                }}
              >
                <DiscardButton onDiscard={onClose} disabled={saving} />
                <SaveButton onSave={handleSave} saving={saving} />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Workout Schedule Update Time Picker Modal */}
      <Modal visible={showWorkoutUpdatePrompt} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowWorkoutUpdatePrompt(false);
            onClose();
          }}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingBottom: 280,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              width: "85%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#065F46",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Update Workout Schedule
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Select your preferred workout time
            </Text>

            <DateTimePicker
              value={workoutTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_: any, d?: Date) => {
                if (d) setWorkoutTime(d);
              }}
              style={{ alignSelf: "center" }}
              textColor="#000000"
              themeVariant="light"
            />

            <View style={{ gap: 10, marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleUpdateWorkoutSchedule}
                disabled={updatingSchedule}
                style={{
                  backgroundColor: updatingSchedule ? "#D1FAE5" : "#F9FF6E",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: updatingSchedule ? 0.7 : 1,
                }}
              >
                <Text style={{ fontWeight: "800", color: "black" }}>
                  {updatingSchedule ? "Updating..." : "Update Workout Schedule"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowWorkoutUpdatePrompt(false);
                  onClose();
                }}
                disabled={updatingSchedule}
                style={{ alignItems: "center", marginTop: 4 }}
              >
                <Text style={{ color: "#6B7280" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
    flex: 1,
  },
  closeBtnInline: {
    padding: 8,
    marginLeft: 12,
  },
  closeText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
