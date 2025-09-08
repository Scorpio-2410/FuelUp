import React from "react";
import { Pressable, Text, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";

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
};

const K_PROFILE = "fu_profile";

type Props = {
  profile: Profile;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
};

function isValidEmail(email: string) {
  if (!email) return true; // optional
  // lightweight check to avoid over-validation
  return /\S+@\S+\.\S+/.test(email);
}

export default function SaveButton({ profile, saving, setSaving }: Props) {
  async function save() {
    if (!profile.username.trim()) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }
    if (!isValidEmail(profile.email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(profile));
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e) {
      console.warn("Profile save error:", e);
      Alert.alert(
        "Save failed",
        "We couldn't save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Pressable
      onPress={save}
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
