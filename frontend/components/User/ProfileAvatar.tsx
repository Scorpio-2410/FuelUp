// components/User/ProfileAvatar.tsx
import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  Platform,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

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

type Props = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

export default function ProfileAvatar({ profile, setProfile }: Props) {
  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Enable Photos access to choose an avatar.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: Platform.OS === "ios" ? "Open Settings" : "Open App Settings",
            onPress: () => Linking.openSettings?.(),
          },
        ]
      );
      return;
    }

    // ✅ Version-safe mediaTypes (new .MediaType if present, else fallback)
    const imageMediaType =
      (ImagePicker as any).MediaType?.Images ??
      (ImagePicker as any).MediaTypeOptions?.Images;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaType as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (res.canceled || !res.assets || !res.assets[0]) return;

    // Persist avatar so it survives restarts (native only)
    const src = res.assets[0].uri;

    // On web, just store the chosen URI
    if (!FileSystem.documentDirectory) {
      setProfile((p) => ({ ...p, avatarUri: src }));
      return;
    }

    try {
      const dir = FileSystem.documentDirectory + "avatar";
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      } catch {}
      const dest = `${dir}/avatar.jpg`;
      await FileSystem.copyAsync({ from: src, to: dest });
      setProfile((p) => ({ ...p, avatarUri: dest }));
    } catch {
      Alert.alert("Avatar", "Could not save avatar image. Please try again.");
    }
  }

  return (
    <Pressable onPress={pickAvatar} className="items-center mb-4">
      <View className="w-28 h-28 rounded-full bg-neutral-800 overflow-hidden items-center justify-center">
        {profile.avatarUri ? (
          <Image
            source={{ uri: profile.avatarUri }}
            className="w-full h-full"
          />
        ) : (
          <Text className="text-neutral-400">Pick Avatar</Text>
        )}
      </View>
    </Pressable>
  );
}
