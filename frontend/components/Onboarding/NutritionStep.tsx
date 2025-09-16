import React from "react";
import { View, Text, Pressable } from "react-native";
import ProfileField from "../User/ProfileField";

export type NutritionDraft = {
  dailyCalorieTarget: string;
  macrosProtein: string;
  macrosCarbs: string;
  macrosFat: string;
  prefCuisines: string;
  dietRestrictions: string;
  dislikedFoods: string;
  allergies: string;
};

type Props = {
  value: NutritionDraft;
  onChange: (v: NutritionDraft) => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export default function NutritionStep({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: Props) {
  return (
    <View className="mt-2 mb-10">
      <ProfileField
        label="Daily calorie target"
        textInputProps={{
          placeholder: "2000",
          keyboardType: "numeric",
          value: value.dailyCalorieTarget,
          onChangeText: (t) => onChange({ ...value, dailyCalorieTarget: t }),
        }}
      />

      <Text className="text-white font-semibold mt-4 mb-2">Macros (g)</Text>
      <ProfileField
        label="Protein"
        textInputProps={{
          placeholder: "150",
          keyboardType: "numeric",
          value: value.macrosProtein,
          onChangeText: (t) => onChange({ ...value, macrosProtein: t }),
        }}
      />
      <ProfileField
        label="Carbs"
        textInputProps={{
          placeholder: "250",
          keyboardType: "numeric",
          value: value.macrosCarbs,
          onChangeText: (t) => onChange({ ...value, macrosCarbs: t }),
        }}
      />
      <ProfileField
        label="Fat"
        textInputProps={{
          placeholder: "70",
          keyboardType: "numeric",
          value: value.macrosFat,
          onChangeText: (t) => onChange({ ...value, macrosFat: t }),
        }}
      />

      <ProfileField
        label="Preferred cuisines (comma-separated)"
        textInputProps={{
          placeholder: "Thai, Italian",
          value: value.prefCuisines,
          onChangeText: (t) => onChange({ ...value, prefCuisines: t }),
        }}
      />

      <ProfileField
        label="Diet restrictions (comma-separated)"
        textInputProps={{
          placeholder: "Halal, Kosher",
          value: value.dietRestrictions,
          onChangeText: (t) => onChange({ ...value, dietRestrictions: t }),
        }}
      />

      <ProfileField
        label="Disliked foods"
        textInputProps={{
          placeholder: "Olives",
          value: value.dislikedFoods,
          onChangeText: (t) => onChange({ ...value, dislikedFoods: t }),
        }}
      />

      <ProfileField
        label="Allergies"
        textInputProps={{
          placeholder: "Peanuts",
          value: value.allergies,
          onChangeText: (t) => onChange({ ...value, allergies: t }),
        }}
      />

      <Pressable
        onPress={onSubmit}
        className="rounded-xl p-3 my-8 bg-green-600">
        <Text className="text-white text-center font-semibold">
          {submitLabel || "Complete onboarding"}
        </Text>
      </Pressable>
    </View>
  );
}
