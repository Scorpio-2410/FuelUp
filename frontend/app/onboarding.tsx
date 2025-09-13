// app/onboarding.tsx
import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import ProfileForm from "../components/User/ProfileForm";
import { apiGetMe, apiUpdateMe, writeProfileCache } from "../constants/api";

type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string;
  heightCm?: number;
  weightKg?: number;
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
  heightUnit?: "cm" | "ft";
  weightUnit?: "kg" | "lb";
  gender?: string;
  activityLevel?: string;
  dailyCalorieGoal?: number;
};

// Map server → form, coercing DOB to a plain date (YYYY-MM-DD)
const toProfile = (u: any): Profile => ({
  username: u?.username ?? "",
  fullName: u?.fullName ?? "",
  email: u?.email ?? "",
  dob: u?.dob ? String(u.dob).slice(0, 10) : undefined,
  heightCm: u?.heightCm ?? undefined,
  weightKg: u?.weightKg ?? undefined,
  notifications: !!(u?.notificationsEnabled ?? true),
  avatarUri: u?.avatarUri ?? undefined,
  ethnicity: u?.ethnicity ?? "not_specified",
  followUpFrequency: u?.followUpFrequency ?? "daily",
  fitnessGoal: u?.fitnessGoal ?? "general_health",
  heightUnit: "cm",
  weightUnit: "kg",
  gender: u?.gender ?? "prefer_not_to_say",
  activityLevel: u?.activityLevel ?? "moderate",
  dailyCalorieGoal: u?.dailyCalorieGoal ?? 2000,
});

// Ensure DOB sent to backend is plain date (no timezone surprises)
function normalizeDob(d?: string | null): string | null {
  if (!d) return null;
  const s = String(d);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : s.slice(0, 10);
}

export default function Onboarding() {
  const [profile, setProfile] = useState<Profile>({
    username: "",
    fullName: "",
    email: "",
    notifications: true,
    followUpFrequency: "daily",
    fitnessGoal: "general_health",
    heightUnit: "cm",
    weightUnit: "kg",
    gender: "prefer_not_to_say",
    activityLevel: "moderate",
    dailyCalorieGoal: 2000,
  });
  const [finishing, setFinishing] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const { user } = await apiGetMe();
      if (user) setProfile(toProfile(user));
    } catch {
      // new user, keep defaults
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const onFinish = async () => {
    try {
      setFinishing(true);
      await apiUpdateMe({
        full_name: profile.fullName || null,
        dob: normalizeDob(profile.dob), // plain YYYY-MM-DD
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
      });

      // Refresh & cache so homepage header/avatar are instant
      const { user } = await apiGetMe();
      if (user) await writeProfileCache(user);

      router.replace("/(tabs)/homepage");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Please try again.");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black px-5 pt-12">
      <Text className="text-white text-2xl font-bold mb-6">
        Tell us about you
      </Text>

      <ProfileForm profile={profile as any} setProfile={setProfile as any} />

      <Pressable
        onPress={onFinish}
        disabled={finishing}
        className={`rounded-xl p-3 mb-10 ${
          finishing ? "bg-green-400" : "bg-green-600"
        }`}>
        <Text className="text-white text-center font-semibold">
          {finishing ? "Finishing…" : "Finish onboarding"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
