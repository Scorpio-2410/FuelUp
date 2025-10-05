// app/(tabs)/user.tsx
import { useEffect, useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import SaveRow from "../../components/User/SaveButton";
import ProfileForm from "../../components/User/ProfileForm";
import CelestialBackground from "../../components/Theme/night/CelestialBackground";
import { useTheme } from "../../contexts/ThemeContext";

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
  const { theme } = useTheme();

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
      <CelestialBackground
        theme={theme}
        intensity="medium">
        <SafeAreaView className="flex-1" edges={["top"]}>
          <View className="flex-1 items-center justify-center">
            <Animated.View
              entering={FadeIn.duration(800)}
              className="w-16 h-16 rounded-full bg-purple-600/20 items-center justify-center mb-4"
            >
              <Text className="text-4xl">💪</Text>
            </Animated.View>
            <Text className="text-white text-lg font-semibold">
              Loading your profile...
            </Text>
          </View>
        </SafeAreaView>
      </CelestialBackground>
    );
  }

  return (
    <CelestialBackground
      theme={theme}
      intensity="medium">
      <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={["top"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
              <View className="flex-1" style={{ paddingBottom: 40 }}>
                {/* Simple Header */}
                <Animated.View
                  entering={FadeInDown.duration(600).springify()}
                  className="pt-6 pb-4 px-6"
                >
                  <Text className="text-white text-3xl font-black tracking-tight">
                    Your Profile
                  </Text>
                </Animated.View>

                {/* Profile Form */}
                <Animated.View
                  entering={FadeIn.delay(200).duration(800)}
                  className="px-5 mt-2"
                >
                  <ProfileForm profile={profile} setProfile={setProfile} />
                </Animated.View>

                {/* Save and Logout Buttons - At bottom of form */}
                <View className="px-5 mt-6 mb-8">
                  <SaveRow
                    profile={profile}
                    saving={saving}
                    setSaving={setSaving}
                  />
                </View>
              </View>
            </RefreshScroll>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </CelestialBackground>
  );
}
