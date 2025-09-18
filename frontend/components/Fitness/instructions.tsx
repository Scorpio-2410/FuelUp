import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Exercise {
  id: string;
  name: string;
  category: string;
  image: any;
}

interface ExerciseInstructionsProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export default function ExerciseInstructions({
  visible,
  exercise,
  onClose,
}: ExerciseInstructionsProps) {
  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#222",
          }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
            {exercise.name}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* video placeholder */}
          <View
            style={{
              width: "100%",
              height: 220,
              backgroundColor: "#1f1f1f",
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}>
            <Ionicons name="play-circle" size={64} color="#4ade80" />
            <Text style={{ color: "#aaa", marginTop: 12 }}>
              {exercise.name} Video Placeholder
            </Text>
          </View>

          {/* instructions*/}
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 16,
            }}>
            Instructions
          </Text>

          {/* instruction steps */}
          {[
            `Start in the correct position for ${exercise.name}.`,
            `Perform the ${exercise.name} movement with controlled form.`,
            `Maintain steady breathing throughout the ${exercise.name}.`,
            `Repeat the ${exercise.name} for the desired number of reps.`,
          ].map((step, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 14,
              }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#4ade80",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  marginTop: 2,
                }}>
                <Text
                  style={{
                    color: "#0a0a0a",
                    fontWeight: "700",
                    fontSize: 14,
                  }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={{ color: "#ccc", fontSize: 16, flex: 1 }}>
                {step}
              </Text>
            </View>
          ))}
          {/* start workout button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#4ade80",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 24,
          }}
          onPress={() => {
            // replace with actual workout start logic
            console.log(`Starting ${exercise.name} workout...`);
          }}>
          <Text
            style={{
              color: "#0a0a0a",
              fontSize: 18,
              fontWeight: "700",
            }}>
            Start Workout
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}