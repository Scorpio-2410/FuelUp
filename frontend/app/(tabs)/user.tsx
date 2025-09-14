// app/(tabs)/user.tsx
import { useEffect, useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";

import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import SaveRow from "../../components/User/SaveButton";
import ProfileForm from "../../components/User/ProfileForm";

import {
  apiGetMe,
  readProfileCache,
  writeProfileCache,
} from "../../constants/api";

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
  gender?: string;
  activityLevel?: string;
  dailyCalorieGoal?: number;
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
  gender: "prefer_not_to_say",
  activityLevel: "moderate",
  dailyCalorieGoal: 2000,
};

// Backend returns camelCase keys (from model.toJSON()).
// Map them to the Profile shape used by the form.
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

export default function UserTabProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pull-to-refresh now fetches from backend
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "user",
    onInternalRefresh: async () => {
      try {
        const { user } = await apiGetMe();
        if (user) {
          setProfile({ ...defaultProfile, ...toProfile(user) });
          await writeProfileCache(user);
        }
      } catch {
        // ignore; keep whatever is on screen
      }
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) hydrate instantly from cache (if present)
        const cached = await readProfileCache();
        if (mounted && cached) {
          setProfile({ ...defaultProfile, ...toProfile(cached) });
        }

        // 2) then fetch authoritative profile from backend
        const { user } = await apiGetMe();
        if (mounted && user) {
          setProfile({ ...defaultProfile, ...toProfile(user) });
          await writeProfileCache(user); // keep cache warm for next time
        }
      } catch {
        // if fetch fails and no cache, show defaults
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
        {/* Save + Logout side by side */}
        <SaveRow profile={profile} saving={saving} setSaving={setSaving} />
      </View>
    </KeyboardAvoidingView>
  );
}
