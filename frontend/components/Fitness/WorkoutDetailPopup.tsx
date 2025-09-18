import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Exercise {
  id: string;
  name: string;
  category: string;
  image: any;
}

interface WorkoutDetailPopupProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get("window");

export default function WorkoutDetailPopup({
  visible,
  exercise,
  onClose,
}: WorkoutDetailPopupProps) {
  if (!exercise) return null;

  // Generate dummy workout details based on exercise data
  const getWorkoutDetails = (exercise: Exercise) => {
    const durations = ["20 min", "30 min", "45 min", "60 min"];
    const intensities = ["Low", "Medium", "High", "Very High"];
    const calories = [150, 200, 280, 350, 420];

    // Use exercise id to generate consistent data
    const seed = parseInt(exercise.id.replace(/\D/g, "") || "1");

    return {
      duration: durations[seed % durations.length],
      intensity: intensities[seed % intensities.length],
      calories: calories[seed % calories.length],
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
            height: screenHeight * 0.7,
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
          <View style={{ flex: 1, padding: 24 }}>
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
                Detailed workout description and instructions will be
                implemented with API integration. This workout focuses on{" "}
                {exercise.category.toLowerCase()} training and provides an
                excellent way to improve your fitness.
              </Text>
            </View>

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
          </View>
        </View>
      </View>
    </Modal>
  );
}
