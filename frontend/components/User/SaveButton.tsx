import React from "react";
import { Pressable, Text, Alert, View } from "react-native";
import { router } from "expo-router";
import { apiUpdateMe, clearToken } from "@/constants/api";

type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string;
  heightCm?: number;
  weightKg?: number;
  gender?: string;
  notifications: boolean;
  avatarUri?: string;
  ethnicity?: string;
  followUpFrequency?: "daily" | "weekly" | "monthly";
  fitnessGoal?:
    | "lose_weight"
    | "build_muscle"
    | "improve_strength"
    | "increase_endurance"
    | "recomposition"
    | "general_health";
  activityLevel?: string;
  dailyCalorieGoal?: number;
};

type Props = {
  profile: Profile;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
};

function isValidEmail(email: string) {
  if (!email) return true; // optional
  return /\S+@\S+\.\S+/.test(email);
}

async function pushToBackend(profile: Profile) {
  // Map camelCase -> DB snake_case
  const payload = {
    username: profile.username || null,
    email: profile.email || null,
    full_name: profile.fullName || null,
    dob: profile.dob || null, // "YYYY-MM-DD" or null
    height_cm: profile.heightCm ?? null,
    weight_kg: profile.weightKg ?? null,
    gender: profile.gender || null,
    avatar_uri: profile.avatarUri || null,
    notifications_enabled: !!profile.notifications,
    follow_up_frequency: profile.followUpFrequency || null,
    ethnicity: profile.ethnicity || null,
    fitness_goal: profile.fitnessGoal || null,
    activity_level: profile.activityLevel || null,
    daily_calorie_goal: profile.dailyCalorieGoal ?? null,
  };

  const res = await apiUpdateMe(payload);
  return res;
}

export function SaveButton({ profile, saving, setSaving }: Props) {
  const onSave = async () => {
    if (!profile.username?.trim()) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }
    if (!isValidEmail(profile.email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    try {
      setSaving(true);
      await pushToBackend(profile);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      console.warn("Profile save error:", e);
      Alert.alert("Save failed", e?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Pressable
      onPress={onSave}
      disabled={saving}
      className={`rounded-xl p-3 ${saving ? "bg-blue-400" : "bg-blue-600"}`}
      accessibilityRole="button"
      accessibilityLabel="Save profile">
      <Text className="text-white text-center font-semibold">
        {saving ? "Saving…" : "Save"}
      </Text>
    </Pressable>
  );
}

export function LogoutButton() {
  const onLogout = async () => {
    await clearToken();
    router.replace("/authlogin");
  };
  return (
    <Pressable
      onPress={onLogout}
      className="rounded-xl p-3 bg-neutral-700"
      accessibilityRole="button"
      accessibilityLabel="Log out">
      <Text className="text-white text-center font-semibold">Log out</Text>
    </Pressable>
  );
}

/**
 * Convenience row: Save + Logout side by side
 */
export default function SaveRow(props: Props) {
  return (
    <View className="flex-row gap-3">
      <SaveButton {...props} />
      <LogoutButton />
    </View>
  );
}
