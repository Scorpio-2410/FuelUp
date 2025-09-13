// components/User/SaveButton.tsx
import React from "react";
import { Pressable, Text, Alert, View } from "react-native";
import { router } from "expo-router";
import {
  apiUpdateMe,
  clearToken,
  apiUpsertFitness,
  apiSetNutritionTargets,
} from "@/constants/api";

type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string;
  heightCm?: number; // keep if you decided to store in users; else ignore
  weightKg?: number; // keep if you decided to store in users; else ignore
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
  if (!email) return true; // email is view-only; skip strict validation
  return /\S+@\S+\.\S+/.test(email);
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

    // Build domain payloads
    const userPatch: Record<string, any> = {
      username: profile.username || null,
      full_name: profile.fullName || null,
      dob: profile.dob || null, // already YYYY-MM-DD from form
      gender: profile.gender || null,
      avatar_uri: profile.avatarUri || null,
      notifications_enabled: !!profile.notifications,
      follow_up_frequency: profile.followUpFrequency || null,
      ethnicity: profile.ethnicity || null,
    };
    // Optional: only if you kept height/weight on users table
    if (profile.heightCm != null) userPatch.height_cm = profile.heightCm;
    if (profile.weightKg != null) userPatch.weight_kg = profile.weightKg;

    const fitnessPatch = {
      goal: profile.fitnessGoal || "general_health",
      activityLevel: profile.activityLevel || "moderate",
      // You can add experienceLevel/daysPerWeek later from UI
    };

    const nutritionTargets: Record<string, any> = {};
    if (profile.dailyCalorieGoal != null) {
      nutritionTargets.dailyCalorieTarget = profile.dailyCalorieGoal;
    }

    try {
      setSaving(true);

      // Save in parallel to the correct services
      const ops: Promise<any>[] = [
        apiUpdateMe(userPatch),
        apiUpsertFitness(fitnessPatch),
      ];
      if (Object.keys(nutritionTargets).length) {
        ops.push(apiSetNutritionTargets(nutritionTargets));
      }
      await Promise.all(ops);

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
      className={`rounded-xl p-3 ${saving ? "bg-green-400" : "bg-green-600"}`}
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

export default function SaveRow(props: Props) {
  return (
    <View className="flex-row gap-3">
      <SaveButton {...props} />
      <LogoutButton />
    </View>
  );
}
