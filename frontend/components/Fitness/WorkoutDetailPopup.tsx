import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ImageBackground,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseAPI } from "./useExerciseAPI";

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  sets?: number;
  reps?: number;
  durationMin?: number;
  restSeconds?: number;
  notes?: string;
  image: any;
}

interface WorkoutDetailPopupProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onViewInstructions: (exercise: any) => void;
}

const { height: screenHeight } = Dimensions.get("window");

export default function WorkoutDetailPopup({
  visible,
  exercise,
  onClose,
  onViewInstructions,
}: WorkoutDetailPopupProps) {
  if (!exercise) return null;

  // Generate workout details from API exercise data
  const getWorkoutDetails = (exercise: Exercise) => {
    // Calculate duration based on sets, reps, and rest time
    const calculateDuration = () => {
      if (exercise.durationMin) {
        return `${exercise.durationMin} min`;
      }

      if (exercise.sets && exercise.reps && exercise.restSeconds) {
        // Rough estimation: 2-3 seconds per rep + rest time between sets
        const workTime = exercise.sets * exercise.reps * 2.5; // seconds
        const restTime = (exercise.sets - 1) * exercise.restSeconds; // seconds
        const totalSeconds = workTime + restTime;
        const minutes = Math.round(totalSeconds / 60);
        return `~${minutes} min`;
      }

      return "15-20 min"; // Default estimation
    };

    // Determine intensity based on difficulty or defaults
    const getIntensity = () => {
      if (exercise.difficulty) {
        switch (exercise.difficulty.toLowerCase()) {
          case "easy":
          case "beginner":
            return "Low";
          case "medium":
          case "intermediate":
            return "Medium";
          case "hard":
          case "advanced":
            return "High";
          default:
            return exercise.difficulty;
        }
      }
      return "Medium"; // Default
    };

    // Estimate calories based on duration and intensity
    const estimateCalories = () => {
      const duration = exercise.durationMin || 15;
      const baseCaloriesPerMin = 8; // Average for strength training
      const intensityMultiplier =
        getIntensity() === "High" ? 1.3 : getIntensity() === "Low" ? 0.7 : 1.0;
      return Math.round(duration * baseCaloriesPerMin * intensityMultiplier);
    };

    return {
      duration: calculateDuration(),
      intensity: getIntensity(),
      calories: estimateCalories(),
    };
  };

  const workoutDetails = getWorkoutDetails(exercise);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            height: screenHeight * 0.8,
            backgroundColor: "#1a1a1a",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
          }}
        >
          {/* Background Image */}
          <ImageBackground
            source={exercise.image}
            style={{
              width: "100%",
              height: 250,
              justifyContent: "flex-end",
            }}
            resizeMode="cover"
          >
            {/* Gradient Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            />

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => {
                onClose();
              }}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Exercise Title and Category */}
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <View
                style={{
                  backgroundColor: "rgba(74, 222, 128, 0.9)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  alignSelf: "flex-start",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: "#0a0a0a",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {exercise.category}
                </Text>
              </View>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: "800",
                  textShadowColor: "rgba(0, 0, 0, 0.7)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {exercise.name}
              </Text>
            </View>
          </ImageBackground>

          {/* Content Section */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Workout Stats */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <Ionicons name="time-outline" size={24} color="#4ade80" />
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Duration
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  {workoutDetails.duration}
                </Text>
              </View>

              <View style={{ alignItems: "center", flex: 1 }}>
                <Ionicons name="flash-outline" size={24} color="#4ade80" />
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Intensity
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  {workoutDetails.intensity}
                </Text>
              </View>

              <View style={{ alignItems: "center", flex: 1 }}>
                <Ionicons name="flame-outline" size={24} color="#4ade80" />
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Calories
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  ~{workoutDetails.calories}
                </Text>
              </View>
            </View>

            {/* Detailed Workout Information */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 16,
                }}
              >
                Workout Details
              </Text>

              {/* Sets and Reps */}
              {(exercise.sets || exercise.reps) && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    backgroundColor: "#2a2a2a",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  {exercise.sets && (
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Ionicons
                        name="repeat-outline"
                        size={20}
                        color="#4ade80"
                      />
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Sets
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: "700",
                          marginTop: 2,
                        }}
                      >
                        {exercise.sets}
                      </Text>
                    </View>
                  )}

                  {exercise.reps && (
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Ionicons name="sync-outline" size={20} color="#4ade80" />
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Reps
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: "700",
                          marginTop: 2,
                        }}
                      >
                        {exercise.reps}
                      </Text>
                    </View>
                  )}

                  {exercise.restSeconds && (
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Ionicons
                        name="pause-outline"
                        size={20}
                        color="#4ade80"
                      />
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Rest
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: "700",
                          marginTop: 2,
                        }}
                      >
                        {exercise.restSeconds}s
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Equipment and Difficulty */}
              <View style={{ gap: 12 }}>
                {exercise.equipment && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color="#4ade80"
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          marginBottom: 2,
                        }}
                      >
                        Equipment
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {exercise.equipment}
                      </Text>
                    </View>
                  </View>
                )}

                {exercise.difficulty && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Ionicons
                      name="trending-up-outline"
                      size={20}
                      color="#4ade80"
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={{
                          color: "#a1a1aa",
                          fontSize: 12,
                          marginBottom: 2,
                        }}
                      >
                        Difficulty
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {exercise.difficulty.charAt(0).toUpperCase() +
                          exercise.difficulty.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}

                {exercise.muscleGroup &&
                  exercise.muscleGroup !== exercise.category && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#2a2a2a",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <Ionicons
                        name="fitness-outline"
                        size={20}
                        color="#4ade80"
                      />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                          style={{
                            color: "#a1a1aa",
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        >
                          Target Muscle
                        </Text>
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 14,
                            fontWeight: "600",
                          }}
                        >
                          {exercise.muscleGroup}
                        </Text>
                      </View>
                    </View>
                  )}
              </View>
            </View>

            {/* Exercise Notes */}
            {exercise.notes && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  Exercise Notes
                </Text>
                <View
                  style={{
                    backgroundColor: "#2a2a2a",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "#a1a1aa",
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {exercise.notes}
                  </Text>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                About This Workout
              </Text>
              <Text
                style={{
                  color: "#a1a1aa",
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {exercise.notes
                  ? `${
                      exercise.notes.length > 100
                        ? exercise.notes.substring(0, 100) + "..."
                        : exercise.notes
                    } `
                  : `This ${exercise.category.toLowerCase()} exercise targets your ${
                      exercise.muscleGroup || exercise.category.toLowerCase()
                    } muscles. `}
                {exercise.sets && exercise.reps
                  ? `Perform ${exercise.sets} sets of ${
                      exercise.reps
                    } repetitions${
                      exercise.restSeconds
                        ? ` with ${exercise.restSeconds} seconds rest between sets`
                        : ""
                    }.`
                  : exercise.durationMin
                  ? `This exercise should be performed for approximately ${exercise.durationMin} minutes.`
                  : "Follow the instructions for proper form and technique."}
                {exercise.equipment &&
                  ` Equipment needed: ${exercise.equipment.toLowerCase()}.`}
                {exercise.difficulty &&
                  ` Difficulty level: ${exercise.difficulty.toLowerCase()}.`}
              </Text>
            </View>

            {/* view instructions  */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4ade80",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                marginBottom: 16,
              }}
              onPress={() => onViewInstructions(exercise)}
            >
              <Ionicons name="play" size={20} color="#0a0a0a" />
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                View Instructions
              </Text>
            </TouchableOpacity>

            {/* Start Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4ade80",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="play" size={20} color="#0a0a0a" />
              <Text
                style={{
                  color: "#0a0a0a",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                Start Workout
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
