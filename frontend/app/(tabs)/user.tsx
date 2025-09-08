import { useEffect, useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import RefreshScroll from "@/components/RefreshScroll";
import { useGlobalRefresh } from "@/components/useGlobalRefresh";
import SaveButton from "@/components/profile/SaveButton";
import ProfileForm from "@/components/profile/ProfileForm";

const K_PROFILE = "fu_profile";

/** Profile type */
export type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string; // YYYY-MM-DD
  heightCm?: number;
  weightKg?: number;
  heightUnit?: "cm" | "ft";
  weightUnit?: "kg" | "lb";
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
};

const defaultProfile: Profile = {
  username: "",
  fullName: "",
  email: "",
  notifications: true,
  followUpFrequency: "daily",
  fitnessGoal: "general_health",
  ethnicity: "not_specified",
  heightUnit: "cm",
  weightUnit: "kg",
};

export default function UserTabProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "user",
    onInternalRefresh: async () => {
      const raw = await SecureStore.getItemAsync(K_PROFILE);
      if (raw) setProfile({ ...defaultProfile, ...JSON.parse(raw) });
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(K_PROFILE);
        setProfile(
          raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile
        );
      } catch (e) {
        console.warn("Profile load error:", e);
        setProfile(defaultProfile);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black">
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View className="flex-1 px-5 pt-8" style={{ paddingBottom: 120 }}>
          <Text className="text-2xl font-semibold text-white mb-4">
            Your Profile
          </Text>

          <ProfileForm profile={profile} setProfile={setProfile} />
        </View>
      </RefreshScroll>

      <View className="px-5 pb-6">
        <SaveButton
          profile={profile as any}
          saving={saving}
          setSaving={setSaving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
