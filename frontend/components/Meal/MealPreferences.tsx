import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import NutritionStep, { NutritionDraft } from "../Onboarding/NutritionStep";
import {
  apiGetNutritionProfile,
  apiUpsertNutritionProfile,
} from "../../constants/api";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MealPreferences({ visible, onClose }: Props) {
  const [value, setValue] = useState<NutritionDraft>({
    prefCuisines: [],
    dietRestrictions: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (visible) {
      setLoading(true);
      (async () => {
        try {
          const { profile } = await apiGetNutritionProfile();
          if (mounted && profile) {
            // profile.prefCuisines and dietRestrictions may be stored as comma strings
            const prefCuisines = profile.prefCuisines
              ? String(profile.prefCuisines).split(/,\s*/).filter(Boolean)
              : [];
            const dietRestrictions = profile.dietRestrictions
              ? String(profile.dietRestrictions).split(/,\s*/).filter(Boolean)
              : [];
            setValue({ prefCuisines, dietRestrictions });
          }
        } catch (e) {
          // ignore
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  const onSubmit = async () => {
    setSaving(true);
    try {
      await apiUpsertNutritionProfile({
        dailyCalorieTarget: null,
        macros: null,
        prefCuisines: value.prefCuisines.length
          ? value.prefCuisines.join(", ")
          : null,
        dietRestrictions: value.dietRestrictions.length
          ? value.dietRestrictions.join(", ")
          : null,
      });
      onClose();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Unable to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Meal Preferences</Text>
            <Pressable style={styles.closeBtnInline} onPress={onClose}>
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
              <NutritionStep
                value={value}
                onChange={setValue}
                onSubmit={onSubmit}
                hideSubmit
              />

              <View
                className="gap-3"
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingBottom: 128,
                }}
              >
                <Pressable
                  onPress={() => {
                    if (!saving) onClose();
                  }}
                  disabled={saving}
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
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text style={{ fontSize: 18 }}>❌</Text>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Discard Changes
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
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
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text style={{ fontSize: 18 }}>{saving ? "⏳" : "💾"}</Text>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Text>
                  </View>
                </Pressable>
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
});
