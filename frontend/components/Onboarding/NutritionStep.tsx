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
    <View className="mt-4 mb-16">
    <Text className="text-white text-lg font-semibold mb-4">Nutrition Goals</Text>
    <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
    <View className="bg-[#1a1a1a] p-4 rounded-xl mb-6 border border-gray-800">
      <ProfileField
        label="Daily calorie target"
        textInputProps={{
          placeholder: "2000",
          keyboardType: "numeric",
          value: value.dailyCalorieTarget,
          onChangeText: (t) => onChange({ ...value, dailyCalorieTarget: t }),
        }}
      />
      </View>

      <Text className="text-white text-lg font-semibold mt-6 mb-3">Macros (g)</Text>
      {/* <View className="flex-row gap-3 mb-3"> */}
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="bg-[#1a1a1a] p-4 rounded-xl mb-6 border border-gray-800 flex-row justify-between">
      <View className="flex-1 mr-2">
      <ProfileField
        label="Protein"
        textInputProps={{
          placeholder: "150",
          keyboardType: "numeric",
          value: value.macrosProtein,
          onChangeText: (t) => onChange({ ...value, macrosProtein: t }),
        }}
      />
      </View>
      <View className="flex-1 mx-1">
      <ProfileField
        label="Carbs"
        textInputProps={{
          placeholder: "250",
          keyboardType: "numeric",
          value: value.macrosCarbs,
          onChangeText: (t) => onChange({ ...value, macrosCarbs: t }),
        }}
      />
      </View>
      <View className="flex-1 ml-2">
      <ProfileField
        label="Fat"
        textInputProps={{
          placeholder: "70",
          keyboardType: "numeric",
          value: value.macrosFat,
          onChangeText: (t) => onChange({ ...value, macrosFat: t }),
        }}
      />
      </View>
      </View>

      <Text className="text-white text-xl font-semibold mt-6 mb-4">Preferences</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="bg-[#1a1a1a] p-4 rounded-xl mb-6 border border-gray-800">
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
      </View>

      <Text className="text-white text-xl font-semibold mb-2">Restrictions</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="bg-[#1a1a1a] p-4 rounded-xl mb-6 border border-gray-800">
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
