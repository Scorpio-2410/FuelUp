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
    const { granted, canAskAgain } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
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
      if (!canAskAgain) return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled && res.assets && res.assets[0]) {
      const uri = res.assets[0].uri;
      setProfile((p) => ({ ...p, avatarUri: uri }));
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
      <Text className="text-neutral-400 mt-2">
        {profile.username ? profile.username : "username"}
      </Text>
    </Pressable>
  );
}
