import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseData } from "./ExerciseData";
import { useMemo } from "react";

interface WorkoutRecommendationHeroProps {
  canGoGym: boolean;
}

export default function WorkoutRecommendationHero({
  canGoGym,
}: WorkoutRecommendationHeroProps) {
  const { exercisesGym, exercisesHome } = useExerciseData();

  // Get a random exercise based on gym availability
  const randomExercise = useMemo(() => {
    const exercises = canGoGym ? exercisesGym : exercisesHome;
    const randomIndex = Math.floor(Math.random() * exercises.length);
    return exercises[randomIndex];
  }, [canGoGym, exercisesGym, exercisesHome]);

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
              marginBottom: 12,
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

          {/* Exercise Image and Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Image
              source={randomExercise?.image}
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                marginRight: 16,
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 24,
                  fontWeight: "800",
                  marginBottom: 4,
                }}
              >
                {randomExercise?.name || "Loading..."}
              </Text>
              <Text
                style={{
                  color: "rgba(10, 10, 10, 0.7)",
                  fontSize: 12,
                  fontWeight: "600",
                  backgroundColor: "rgba(10, 10, 10, 0.1)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                {randomExercise?.category}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: "rgba(10, 10, 10, 0.8)",
              fontSize: 14,
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            Description for workout, implement API later
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
