import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutRecommendationHeroProps {
  canGoGym: boolean;
}

export default function WorkoutRecommendationHero({
  canGoGym,
}: WorkoutRecommendationHeroProps) {
  return (
    <View style={{ paddingHorizontal: 24, marginTop: 16, marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: "linear-gradient(135deg, #4ade80, #22c55e)",
          borderRadius: 20,
          padding: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient effect */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#4ade80",
            borderRadius: 20,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            backgroundColor: "rgba(34, 197, 94, 0.3)",
            borderRadius: 75,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 100,
            height: 100,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 50,
          }}
        />

        {/* Content */}
        <View style={{ position: "relative", zIndex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons name="flash" size={24} color="#0a0a0a" />
            <Text
              style={{
                color: "#0a0a0a",
                fontSize: 18,
                fontWeight: "700",
                marginLeft: 8,
              }}
            >
              Today's Recommended Workout
            </Text>
          </View>

          <Text
            style={{
              color: "#0a0a0a",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 6,
            }}
          >
            {canGoGym ? "Upper Body Strength" : "HIIT Cardio Blast"}
          </Text>

          <Text
            style={{
              color: "rgba(10, 10, 10, 0.8)",
              fontSize: 14,
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            {canGoGym
              ? "Focus on chest, back, and shoulders. Perfect for building upper body strength and muscle definition."
              : "High-intensity interval training to boost your cardio and burn calories from home."}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="time-outline" size={16} color="#0a0a0a" />
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 14,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                45 min
              </Text>
              <Ionicons
                name="flame-outline"
                size={16}
                color="#0a0a0a"
                style={{ marginLeft: 16 }}
              />
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 14,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                ~320 kcal
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: "rgba(10, 10, 10, 0.15)",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 14,
                  fontWeight: "700",
                  marginRight: 4,
                }}
              >
                Start Now
              </Text>
              <Ionicons name="play" size={14} color="#0a0a0a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
