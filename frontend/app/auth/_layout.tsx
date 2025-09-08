import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#B3FF6E",
        contentStyle: { backgroundColor: "#1a1a1a" },
        headerTitle: "FuelUp",
        headerTitleStyle: { color: "#B3FF6E", fontWeight: "800" },
      }}
    />
  );
}
