// frontend/components/User/SaveButton.tsx
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { apiUpdateMe, clearToken, writeProfileCache } from "@/constants/api";
import CustomAlert from "./CustomAlert";

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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "warning";
  }>({ title: "", message: "", type: "success" });

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" = "success") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const onSave = async () => {
    if (!profile.username?.trim()) {
      showAlert("Username Required", "Please enter a username.", "warning");
      return;
    }
    if (!isValidEmail(profile.email)) {
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }

    // Map to backend's expected snake_case
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
      showAlert("Saved", "Your profile has been updated successfully.", "success");
    } catch (e: any) {
      showAlert("Save Failed", e?.message ?? "Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={onSave}
        disabled={saving}
        className={`rounded-2xl py-4 ${saving ? "bg-emerald-500/80" : "bg-emerald-500"}`}
        style={{ 
          flexBasis: "48%", 
          flexGrow: 1,
          shadowColor: "#10B981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: saving ? 0.3 : 0.5,
          shadowRadius: 8,
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Save profile">
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-lg">{saving ? "⏳" : "💾"}</Text>
          <Text className="text-white text-center font-bold text-base">
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </View>
      </Pressable>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}

export function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutPress = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowConfirm(false);
    await clearToken();
    router.replace("/authlogin");
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <Pressable
        onPress={handleLogoutPress}
        className="rounded-2xl py-4 bg-red-500/80 border border-red-400/30"
        style={{ 
          flexBasis: "48%", 
          flexGrow: 1,
          shadowColor: "#EF4444",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Log out">
        <View className="flex-row items-center justify-center gap-2">
          <Text className="text-lg">🚪</Text>
          <Text className="text-white text-center font-bold text-base">Log Out</Text>
        </View>
      </Pressable>

      <CustomAlert
        visible={showConfirm}
        title="Log Out?"
        message="Are you sure you want to log out? You'll need to sign in again to access your profile."
        type="warning"
        showCancel={true}
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onClose={handleCancelLogout}
      />
    </>
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
