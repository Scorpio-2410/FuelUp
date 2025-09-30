// components/Fitness/ExerciseDetailModal.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGetExerciseDetail, getExerciseImageUri } from "../../constants/api";
import type { ExerciseListItem } from "./useExerciseAPI";

const fallback = require("../../assets/images/fitness.png");

type Props = {
  visible: boolean;
  exercise: ExerciseListItem | null;
  onClose: () => void;
};

export default function ExerciseDetailModal({
  visible,
  exercise,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !exercise) return;

    let mounted = true;

    // Always show the GIF immediately (180 px)
    setGifUri(getExerciseImageUri(exercise.id, "180"));

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setDetail(null);

        // Pull full exercise payload (instructions, equipment, etc.)
        const { item } = await apiGetExerciseDetail(exercise.id);
        if (!mounted) return;

        setDetail(item || {});
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load exercise");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [visible, exercise]);

  if (!exercise) return null;

  const bodyPart = detail?.bodyPart ?? exercise.bodyPart;
  const target = detail?.target;
  const equipment = detail?.equipment;
  const instructions: string[] = Array.isArray(detail?.instructions)
    ? detail.instructions
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Header */}
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
            {exercise.name}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* GIF / image */}
          <View
            style={{
              width: "100%",
              height: 220,
              backgroundColor: "#111",
              borderRadius: 16,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
            {gifUri ? (
              <Image
                source={{ uri: gifUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : loading ? (
              <ActivityIndicator />
            ) : (
              <Image
                source={fallback}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Meta */}
          {error ? (
            <Text style={{ color: "#ef4444", marginBottom: 12 }}>{error}</Text>
          ) : null}

          <View style={{ gap: 6, marginBottom: 16 }}>
            {!!bodyPart && (
              <Text style={{ color: "#9CA3AF" }}>
                Body part: <Text style={{ color: "#fff" }}>{bodyPart}</Text>
              </Text>
            )}
            {!!target && (
              <Text style={{ color: "#9CA3AF" }}>
                Target: <Text style={{ color: "#fff" }}>{target}</Text>
              </Text>
            )}
            {!!equipment && (
              <Text style={{ color: "#9CA3AF" }}>
                Equipment: <Text style={{ color: "#fff" }}>{equipment}</Text>
              </Text>
            )}
          </View>

          {/* Instructions */}
          {instructions.length > 0 && (
            <>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 10,
                }}>
                Instructions
              </Text>
              {instructions.map((step: string, idx: number) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 10,
                  }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#4ade80",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                    }}>
                    <Text style={{ color: "#0a0a0a", fontWeight: "800" }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={{ color: "#d1d5db", flex: 1 }}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
