import { View, Text, TouchableOpacity, Image } from "react-native";

interface Exercise {
  id: string;
  name: string;
  category: string;
  image: any;
}

interface ExerciseGridProps {
  exercises: Exercise[];
  onExercisePress: (exercise: Exercise) => void;
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
        }}
      >
        {exercises.map((ex) => (
          <View key={ex.id} style={{ width: "48%", marginBottom: 14 }}>
            <TouchableOpacity
              style={{
                backgroundColor: "#2a2a2a",
                borderRadius: 16,
                overflow: "hidden",
              }}
              onPress={() => onExercisePress(ex)}
            >
              <Image
                source={ex.image}
                style={{ width: "100%", height: 110 }}
                resizeMode="cover"
              />
              <View style={{ padding: 10 }}>
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                  {ex.name}
                </Text>
                <Text style={{ color: "#a1a1aa", marginTop: 2, fontSize: 12 }}>
                  {ex.category}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {exercises.length === 0 ? (
        <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
          No exercises found.
        </Text>
      ) : null}
    </View>
  );
}
