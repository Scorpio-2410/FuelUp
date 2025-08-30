import { Stack } from "expo-router";

export default function UserStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> {/* /user */}
      <Stack.Screen name="profile" /> {/* /user/profile */}
      {/* add more: schedule.tsx, goals.tsx, etc. */}
    </Stack>
  );
}
