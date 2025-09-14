// frontend/components/User/SaveButton.tsx
import React from "react";
import { Pressable, Text, Alert, View } from "react-native";
import { router } from "expo-router";
import { apiUpdateMe, clearToken, writeProfileCache } from "@/constants/api";

type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string; // already "YYYY-MM-DD" from ProfileForm
  gender?: string;
  ethnicity?: string;
  followUpFrequency?: "daily" | "weekly" | "monthly";
  notifications: boolean;
  avatarUri?: string;
};

type Props = {
  profile: Profile;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
};

function isValidEmail(email: string) {
  if (!email) return true; // read-only in UI; don't block
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

    // Map to backend’s expected snake_case
    const userPatch: Record<string, any> = {
      username: profile.username || null,
      full_name: profile.fullName || null,
      dob: profile.dob || null,
      gender: profile.gender || null,
      avatar_uri: profile.avatarUri || null,
      notifications_enabled: !!profile.notifications,
      follow_up_frequency: profile.followUpFrequency || null,
      ethnicity: profile.ethnicity || null,
      // email is view-only in the form, but sending it unchanged is fine:
      email: profile.email || null,
    };

    try {
      setSaving(true);
      const { user } = await apiUpdateMe(userPatch);
      if (user) await writeProfileCache(user);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
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
      style={{ flexBasis: "48%", flexGrow: 1 }}
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
      style={{ flexBasis: "48%", flexGrow: 1 }}
      accessibilityRole="button"
      accessibilityLabel="Log out">
      <Text className="text-white text-center font-semibold">Log out</Text>
    </Pressable>
  );
}

export default function SaveRow(props: Props) {
  // Row that wraps to stack on narrow screens
  return (
    <View className="gap-3" style={{ flexDirection: "row", flexWrap: "wrap" }}>
      <SaveButton {...props} />
      <LogoutButton />
    </View>
  );
}
