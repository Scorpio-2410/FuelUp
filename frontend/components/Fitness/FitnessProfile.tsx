import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import FitnessStep, { Fitness } from "../Onboarding/FitnessStep";
import {
  apiGetFitnessProfile,
  apiUpsertFitnessProfile,
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
            setFitness(loadedFitness);
            setInitialFitness(loadedFitness);
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
      // Convert height/weight to numbers for backend
      const payload = {
        goal: fitness.goal ?? null,
        activityLevel: fitness.activityLevel ?? null,
        daysPerWeek: fitness.daysPerWeek ? Number(fitness.daysPerWeek) : null,
        heightCm: fitness.heightUnit === "cm" ? Number(fitness.height) : null, // TODO: convert ft/in to cm if needed
        weightKg: fitness.weightUnit === "kg" ? Number(fitness.weight) : null, // TODO: convert lb to kg if needed
      };
      await apiUpsertFitnessProfile(payload);
      setInitialFitness(fitness); // update initial state after save
      // Optionally, show a success message
    } finally {
      setSaving(false);
      onClose();
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
