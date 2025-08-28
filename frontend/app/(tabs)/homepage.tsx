// app/(tabs)/homepage.tsx
import { View, Text, Pressable } from "react-native";

export default function HomePageScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-slate-50">
      <View className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-lg">
        <Text className="text-3xl font-extrabold tracking-tight text-blue-600">Tailwind is Working</Text>

        <Text className="mt-2 text-base text-neutral-600">
          Edit <Text className="font-mono">app/(tabs)/homepage.tsx</Text> and watch styles update.
        </Text>

        <View className="my-6 h-px w-full bg-neutral-200" />

        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-emerald-100 px-3 py-1">
            <Text className="text-sm font-medium text-emerald-700">Tailwind Active</Text>
          </View>
        </View>

        <View className="mt-5 gap-3">
          <Pressable className="rounded-md bg-blue-600 px-4 py-3">
            <Text className="text-center font-semibold text-white">Primary Button</Text>
          </Pressable>
          <Pressable className="rounded-md bg-emerald-600 px-4 py-3">
            <Text className="text-center font-semibold text-white">Success Button</Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-xs text-neutral-400">
          Colors update on all platforms.
        </Text>
      </View>
    </View>
  );
}


