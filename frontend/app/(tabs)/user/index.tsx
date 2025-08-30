import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function UserHome() {
  return (
    <View className="flex-1 bg-black px-5 pt-8 gap-4">
      <Text className="text-2xl font-semibold text-white">Your Settings</Text>

      {/* Profile only for now */}
      <Link href="/(tabs)/user/profile" asChild>
        <Pressable className="rounded-xl bg-neutral-900 p-4 border border-neutral-800">
          <Text className="text-lg text-white font-medium">
            Profile & Account
          </Text>
          <Text className="text-neutral-400 mt-1">
            Name, email, units, theme, notifications
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
