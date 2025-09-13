// components/User/SaveButton.tsx
import React, { useCallback } from "react";
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

async function pushToBackend(profile: Profile) {
  // Map camelCase -> DB snake_case (do NOT send email since it's not editable)
  const payload = {
    username: profile.username || null,
    full_name: profile.fullName || null,
    dob: profile.dob || null,
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

  return apiUpdateMe(payload);
}

export function SaveButton({ profile, saving, setSaving }: Props) {
  const onSave = useCallback(async () => {
    if (!profile.username?.trim()) {
      Alert.alert("Username required", "Please enter a username.");
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
  }, [profile, setSaving]);

  return (
    <Pressable
      onPress={onSave}
      disabled={saving}
      className={`rounded-xl px-6 py-3 w-3/4 ${
        saving ? "bg-green-400" : "bg-green-600"
      }`}
      accessibilityRole="button"
      accessibilityLabel="Save profile">
      <Text className="text-white text-center font-semibold">
        {saving ? "Saving…" : "Save"}
      </Text>
    </Pressable>
  );
}

export function LogoutButton() {
  const onLogout = useCallback(async () => {
    await clearToken();
    router.replace("/authlogin");
  }, []);

  return (
    <Pressable
      onPress={onLogout}
      className="rounded-xl px-6 py-3 w-3/4 bg-neutral-700"
      accessibilityRole="button"
      accessibilityLabel="Log out">
      <Text className="text-white text-center font-semibold">Log out</Text>
    </Pressable>
  );
}

/** Centered green-themed actions */
export default function SaveRow(props: Props) {
  return (
    <View className="items-center gap-3">
      <SaveButton {...props} />
      <LogoutButton />
    </View>
  );
}
