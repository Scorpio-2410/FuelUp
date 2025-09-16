import React from "react";
import { View, Image, Pressable, Text, Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { apiUpdateMe } from "../../constants/api";

type Props = {
  profile: { avatarUri?: string };
  setProfile: (updater: any) => void;
  autosave?: boolean; // when true, immediately PUT avatar_uri to backend
};

export default function ProfileAvatar({
  profile,
  setProfile,
  autosave = false,
}: Props) {
  async function ensurePermission() {
    const { status, canAskAgain } =
      await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status === "granted") return true;

    const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (req.status === "granted") return true;

    // on iOS show a quick link to Settings
    if (Platform.OS === "ios" && !req.canAskAgain) {
      Alert.alert(
        "Allow Photos Access",
        "We need access to your library to pick a profile photo.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }
    return false;
  }

  async function pickAvatar() {
    if (!(await ensurePermission())) return;

    // Support both new and old ImagePicker API shapes
    const mediaTypes: any =
      (ImagePicker as any).MediaType?.Images ??
      ImagePicker.MediaTypeOptions?.Images;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    } as any);

    if (res.canceled || !res.assets || !res.assets[0]) return;

    // Persist selected image to a stable path so it survives restarts
    const src = res.assets[0].uri;
    const dir = FileSystem.documentDirectory + "avatar";
    try {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    } catch {}
    const dest = `${dir}/avatar-${Date.now()}.jpg`;
    try {
      await FileSystem.copyAsync({ from: src, to: dest });
    } catch (e) {
      // If copy fails, fall back to original uri
      console.warn("avatar copy failed, using original uri", e);
      setProfile((p: any) => ({ ...p, avatarUri: src }));
      if (autosave) await apiUpdateMe({ avatar_uri: src });
      return;
    }

    setProfile((p: any) => ({ ...p, avatarUri: dest }));
    if (autosave) {
      try {
        await apiUpdateMe({ avatar_uri: dest });
      } catch (e) {
        console.warn("autosave avatar failed", e);
      }
    }
  }

  return (
    <View className="items-center mb-4">
      <Pressable
        onPress={pickAvatar}
        className="w-24 h-24 rounded-full overflow-hidden">
        {profile.avatarUri ? (
          <Image
            source={{ uri: profile.avatarUri }}
            className="w-full h-full"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-neutral-800">
            <Text className="text-gray-400">Add photo</Text>
          </View>
        )}
      </Pressable>
      <Text className="text-gray-400 mt-2 text-xs">Tap to change</Text>
    </View>
  );
}
