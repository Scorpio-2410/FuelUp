// components/Fitness/TargetFilterBar.tsx
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export const MUSCLE_GROUPS = [
  "abductors",
  "abs",
  "adductors",
  "biceps",
  "calves",
  "cardiovascular system",
  "delts",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "levator scapulae",
  "pectorals",
  "quads",
  "serratus anterior",
  "traps",
  "triceps",
  "upper back",
] as const;

type Props = {
  value: string; // one of MUSCLE_GROUPS
  onChange: (v: string) => void;
};

export default function TargetFilterBar({ value, onChange }: Props) {
  const items = useMemo(() => MUSCLE_GROUPS, []);

  return (
    <View style={{ paddingTop: 8, paddingBottom: 4 }}>
      <View style={{ paddingHorizontal: 24, marginBottom: 6 }}>
        <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>Target:</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 8,
          alignItems: "center",
        }}
      >
        {items.map((g) => {
          const active = value === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => onChange(g)}
              activeOpacity={0.9}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? "#22c55e" : "#27272a",
                borderWidth: 1,
                borderColor: active ? "#16a34a" : "#3f3f46",
              }}
            >
              <Text
                style={{
                  color: active ? "#052e16" : "#e5e7eb",
                  fontWeight: "700",
                  fontSize: 13,
                  textTransform: "capitalize",
                }}
              >
                {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
