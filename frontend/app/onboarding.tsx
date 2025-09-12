// app/onboarding.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import ProfileForm from "../components/User/ProfileForm";
import { apiGetMe, apiUpdateMe } from "../constants/api";

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

const toProfile = (u: any): Profile => ({
  username: u?.username ?? "",
  fullName: u?.fullName ?? "",
  email: u?.email ?? "",
  dob: u?.dob ?? undefined,
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

  useEffect(() => {
    (async () => {
      try {
        const { user } = await apiGetMe();
        if (user) setProfile(toProfile(user));
      } catch {
        // brand new user
      }
    })();
  }, []);

  const onFinish = async () => {
    try {
      setFinishing(true);
      await apiUpdateMe({
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
      });
      Alert.alert("All set!", "Your profile is ready.");
      router.replace("./(tabs)");
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
