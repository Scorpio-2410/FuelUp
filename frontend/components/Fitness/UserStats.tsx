import { View, Text } from "react-native";

export default function UserStats() {
  return (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#2a2a2a",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text style={{ color: "#a1a1aa", marginBottom: 6 }}>Workouts</Text>
          <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}>
            4 this week
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#2a2a2a",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Text style={{ color: "#a1a1aa", marginBottom: 6 }}>Calories</Text>
          <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}>
            1,940 kcal
          </Text>
        </View>
      </View>
    </View>
  );
}
