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
    <View className="items-center mb-8">
      <Pressable
        onPress={pickAvatar}
        className="relative"
        style={{
          shadowColor: "#8B5CF6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}>
        <View className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-500/30">
          {profile.avatarUri ? (
            <Image
              source={{ uri: profile.avatarUri }}
              className="w-full h-full"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
              <Text className="text-5xl">📸</Text>
            </View>
          )}
        </View>
        {/* Edit Badge */}
        <View 
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-purple-600 items-center justify-center border-2 border-black"
          style={{
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 4,
          }}>
          <Text className="text-white text-xs font-bold">✏️</Text>
        </View>
      </Pressable>
      <Text className="text-purple-300 mt-3 text-sm font-semibold">Tap to change photo</Text>
    </View>
  );
}
