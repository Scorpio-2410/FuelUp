import React, { useState, useEffect, useCallback,} from "react";
import * as SecureStore from "expo-secure-store";
import { View, Text, ScrollView, Dimensions, Image, Pressable } from "react-native";
import { useRouter } from "expo-router"; // optional, only if you want navigation
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const K_PROFILE = "fu_profile";

type Profile = {
  username: string;
  avatarUri?: string;
};



export default function MealScreen() {
  const [profile, setProfile] = useState<Profile>({ username: "" });
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useFocusEffect(
  useCallback(() => {
    let alive = true;
    (async () => {
      const raw = await SecureStore.getItemAsync(K_PROFILE);
      if (alive && raw) {
        const parsed = JSON.parse(raw);
        setProfile({
          username: parsed?.username || "",
          avatarUri: parsed?.avatarUri,
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [])
);

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24, // <-- side gap like on Home
        }}
      >
        {/* Header / hero */}
<View className="flex-row items-center justify-between mb-6">
  {/* Left: title/subtitle */}
            <View
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{ backgroundColor: "#2a2a2a" }}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  className="w-full h-full"
                />
              ) : null}
            </View> 

  {/* Right: settings button */}
  <Pressable
    onPress={() => router.push("/meal-settings")}
    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    accessibilityRole="button"
    accessibilityLabel="Open meal settings"
    style={{ padding: 6 }}
  >
    <FontAwesome name="cog" size={24} color="#fff" />
  </Pressable>
</View>

        {/* Card row */}
        <View className="flex-row gap-4">
          <View
            className="flex-1 p-4 rounded-2xl"
            style={{ backgroundColor: "#c59fc4" }}
          >
            <Text className="text-black text-xl font-bold mb-1">Steps</Text>
            <Text className="text-black text-3xl font-bold">1800-ligmaball</Text>
            <Text className="text-black text-sm">Steps</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
