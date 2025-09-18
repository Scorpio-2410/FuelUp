import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CalendarShortcutProps {
  onPress: () => void;
}

export default function CalendarShortcut({ onPress }: CalendarShortcutProps) {
  return (
    <View
      style={{
        alignItems: "center",
        marginTop: 24,
        paddingHorizontal: 24,
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: "#4ade80",
          padding: 16,
          borderRadius: 50,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
        onPress={onPress}
      >
        <Text style={{ color: "#0a0a0a", fontSize: 16, fontWeight: "600" }}>
          Want to adjust your schedule?
        </Text>
        <Ionicons name="calendar-outline" size={38} color="#0a0a0a" />
      </TouchableOpacity>
    </View>
  );
}
