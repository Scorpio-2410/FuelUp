import React from "react";
import { View, Text, Pressable } from "react-native";

export type NutritionDraft = {
  prefCuisines: string[]; // multi-select
  dietRestrictions: string[]; // multi-select
};

type Props = {
  value: NutritionDraft;
  onChange: (v: NutritionDraft) => void;
  onSubmit: () => void;
  submitLabel?: string;
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-xl border ${
        active
          ? "bg-green-700 border-green-600"
          : "bg-transparent border-gray-700"
      }`}>
      <Text className={active ? "text-white" : "text-gray-300"}>{label}</Text>
    </Pressable>
  );
}

const CUISINE_OPTIONS = [
  "American",
  "Italian",
  "Mexican",
  "Thai",
  "Chinese",
  "Japanese",
  "Korean",
  "Indian",
  "Middle Eastern",
  "Mediterranean",
  "Greek",
  "Vietnamese",
  "Spanish",
  "French",
  "African",
];

const DIET_OPTIONS = [
  "Halal",
  "Kosher",
  "Vegan",
  "Vegetarian",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Shellfish-free",
  "Low-FODMAP",
];

export default function NutritionStep({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: Props) {
  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <View className="mt-4 mb-16">
      {/* Preferences */}
      <Text className="text-white text-xl font-semibold mt-2 mb-3">
        Preferences
      </Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />

      {/* Cuisines multi-select */}
      <Text className="text-gray-300 mb-2">Preferred cuisines</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {CUISINE_OPTIONS.map((c) => (
          <Chip
            key={c}
            label={c}
            active={value.prefCuisines.includes(c)}
            onPress={() =>
              onChange({
                ...value,
                prefCuisines: toggle(value.prefCuisines, c),
              })
            }
          />
        ))}
      </View>

      {/* Diet restrictions multi-select */}
      <Text className="text-gray-300 mb-2">Diet restrictions</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {DIET_OPTIONS.map((d) => (
          <Chip
            key={d}
            label={d}
            active={value.dietRestrictions.includes(d)}
            onPress={() =>
              onChange({
                ...value,
                dietRestrictions: toggle(value.dietRestrictions, d),
              })
            }
          />
        ))}
      </View>

      <Pressable
        onPress={onSubmit}
        className="rounded-2xl p-4 mt-10 bg-green-600 shadow-lg">
        <Text className="text-white text-center font-semibold text-lg">
          {submitLabel || "Complete onboarding"}
        </Text>
      </Pressable>
    </View>
  );
}
