// frontend/components/Fitness/ExerciseGrid.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { getExerciseImageUri } from "@/constants/api";

export interface ExerciseCard {
  id: string;
  name: string;
  bodyPart?: string;
}

interface ExerciseGridProps {
  exercises: ExerciseCard[];
  onExercisePress: (exercise: ExerciseCard) => void;
}

export default function ExerciseGrid({
  exercises,
  onExercisePress,
}: ExerciseGridProps) {
  return (
    <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}>
        {exercises?.map((ex) => {
          const uri = getExerciseImageUri(ex.id, "180");
          return (
            <View key={ex.id} style={{ width: "48%", marginBottom: 14 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
                onPress={() => onExercisePress(ex)}
                activeOpacity={0.85}>
                <Image
                  source={{ uri }}
                  // fallback (shows while loading / if error)
                  defaultSource={require("../../assets/images/fitness.png")}
                  style={{
                    width: "100%",
                    height: 120,
                    backgroundColor: "#1f1f1f",
                  }}
                  resizeMode="cover"
                />
                <View style={{ padding: 10 }}>
                  <Text
                    style={{ color: "#ffffff", fontWeight: "700" }}
                    numberOfLines={1}>
                    {ex.name}
                  </Text>
                  {!!ex.bodyPart && (
                    <Text
                      style={{ color: "#a1a1aa", marginTop: 2, fontSize: 12 }}
                      numberOfLines={1}>
                      {ex.bodyPart}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {(!exercises || exercises.length === 0) && (
        <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
          No exercises found.
        </Text>
      )}
    </View>
  );
}
