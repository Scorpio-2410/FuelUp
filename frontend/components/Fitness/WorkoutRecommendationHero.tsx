import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseAPI } from "./useExerciseAPI";
import { useMemo } from "react";

interface WorkoutRecommendationHeroProps {
  canGoGym: boolean;
}

export default function WorkoutRecommendationHero({
  canGoGym,
}: WorkoutRecommendationHeroProps) {
  const { exercisesGym, exercisesHome, loading } = useExerciseAPI();

  // Get a random exercise based on gym availability
  const randomExercise = useMemo(() => {
    const exercises = canGoGym ? exercisesGym : exercisesHome;
    if (!exercises || exercises.length === 0) return null;
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
                {loading
                  ? "Loading..."
                  : randomExercise?.name || "No exercises available"}
              </Text>
              {randomExercise && (
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
                  {randomExercise.categoryInfo?.name || randomExercise.category}
                </Text>
              )}
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
            {loading
              ? "Loading exercise details..."
              : randomExercise?.notes ||
                `A great ${
                  canGoGym ? "gym" : "home"
                } workout to help you stay fit and healthy!`}
          </Text>

          {/* Exercise Details Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="time-outline" size={16} color="#0a0a0a" />
            <Text
              style={{
                color: "#0a0a0a",
                fontSize: 14,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {randomExercise?.durationMin
                ? `${randomExercise.durationMin} min`
                : "45 min"}
            </Text>
            {randomExercise?.sets && randomExercise?.reps && (
              <>
                <Ionicons
                  name="fitness-outline"
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
                  {randomExercise.sets}×{randomExercise.reps}
                </Text>
              </>
            )}
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

          {/* Start Now Button Row */}
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 25,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "stretch",
              marginTop: 4,
            }}
          >
            <Ionicons
              name="play"
              size={16}
              color="#0a0a0a"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: "#0a0a0a",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Start Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
