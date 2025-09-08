import { useEffect, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import RefreshScroll from "@/components/RefreshScroll";
import { useGlobalRefresh } from "@/components/useGlobalRefresh";
import SaveButton from "@/components/profile/SaveButton";
import ProfileForm from "@/components/profile/ProfileForm";

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

const API_BASE = "http://localhost:4000"; // change when testing on device
const K_PROFILE = "fu_profile";

// ---------- helpers ----------
const num = (v: any) =>
  v === null || v === undefined || v === "" ? undefined : Number(v);

// Normalize any SQL/ISO date to strict "YYYY-MM-DD"
const normalizeDob = (raw: any): string | undefined => {
  if (!raw) return undefined;
  // Already in YYYY-MM-DD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw);
  // Try parsing any ISO-ish value
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Map backend user (snake_case or camelCase) -> Profile
const mapFromServer = (u: any): Profile => ({
  username: u.username ?? "",
  fullName: u.full_name ?? u.fullName ?? "",
  email: u.email ?? "",
  dob: normalizeDob(u.dob ?? u.DOB),
  heightCm: num(u.height_cm ?? u.heightCm),
  weightKg: num(u.weight_kg ?? u.weightKg),
  notifications: (u.notifications ?? true) as boolean,
  avatarUri: u.avatar_uri ?? u.avatarUri ?? undefined,
  ethnicity: u.ethnicity ?? "not_specified",
  followUpFrequency: u.follow_up_frequency ?? u.followUpFrequency ?? "daily",
  fitnessGoal: u.fitness_goal ?? u.fitnessGoal ?? "general_health",
  heightUnit: "cm",
  weightUnit: "kg",
});

// Map Profile (camelCase) -> backend payload (snake_case)
const mapToServer = (p: Profile) => ({
  username: p.username,
  full_name: p.fullName,
  email: p.email,
  // ensure we only ever send YYYY-MM-DD or leave undefined to skip updating
  dob: p.dob ? normalizeDob(p.dob) : undefined,
  height_cm: p.heightCm,
  weight_kg: p.weightKg,
  notifications: p.notifications,
  avatar_uri: p.avatarUri,
  ethnicity: p.ethnicity,
  follow_up_frequency: p.followUpFrequency,
  fitness_goal: p.fitnessGoal,
});

export default function UserTabProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        await AsyncStorage.removeItem("authToken");
        router.replace("/auth/login");
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load profile");

      const mapped = mapFromServer(json.user);
      setProfile({ ...defaultProfile, ...mapped });
      await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(mapped));
    } catch {
      const raw = await SecureStore.getItemAsync(K_PROFILE);
      setProfile(
        raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "user",
    onInternalRefresh: loadProfile,
  });

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Not logged in");

      const payload = mapToServer(profile);
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.status === 401) {
        await AsyncStorage.removeItem("authToken");
        router.replace("/auth/login");
        return;
      }
      if (!res.ok) throw new Error(json?.error || "Failed to update profile");

      const mapped = mapFromServer(json.user);
      setProfile(mapped);
      await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(mapped));
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    await SecureStore.deleteItemAsync(K_PROFILE);
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#B3FF6E" />
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
        <SaveButton saving={saving} onSave={saveProfile} />
        <TouchableOpacity
          onPress={logout}
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#ef4444",
          }}>
          <Text className="text-center text-white font-semibold">Log out</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
