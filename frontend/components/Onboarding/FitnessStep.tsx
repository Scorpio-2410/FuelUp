import React from "react";
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import ProfileField from "../User/ProfileField";

export type Fitness = {
  goal?: string;
  activityLevel?: string;
  experienceLevel?: string;
  daysPerWeek?: string; // keep as string; parse on submit
  sessionLengthMin?: string; // keep as string; parse on submit
  trainingLocation?: string;
  equipmentAvailable?: string; // CSV text for now
  preferredActivities?: string; // CSV text for now
  injuriesOrLimitations?: string;
  coachingStyle?: "gentle" | "balanced" | "intense";
  heightCm?: string; // keep as string; parse on submit
  weightKg?: string; // keep as string; parse on submit
};

type Props = {
  value: Fitness;
  onChange: (v: Fitness) => void;
  /** Optional onNext so the screen can supply its own CTA */
  onNext?: () => void;
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

export default function FitnessStep({ value, onChange }: Props) {
  return (
    <View className="mt-2 mb-12">
      {/* Days / week */}
      <Text className="text-white text-lg font-semibold mb-3">General Info</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="flex-row gap-3 mb-4">
      <View className="flex-1">
      <ProfileField
        label="Days / week"
        textInputProps={{
          placeholder: "e.g. 3",
          keyboardType: "numeric",
          value: value.daysPerWeek ?? "",
          onChangeText: (t) => onChange({ ...value, daysPerWeek: t }),
        }}
      />
      </View>

      {/* Session length */}
      <View className="flex-1">
      <ProfileField
        label="Session length (min)"
        textInputProps={{
          placeholder: "e.g. 45",
          keyboardType: "numeric",
          value: value.sessionLengthMin ?? "",
          onChangeText: (t) => onChange({ ...value, sessionLengthMin: t }),
        }}
      />
      </View>
      </View>

      {/* Training location */}
      <Text className="text-white text-lg font-semibold mb-3">Training</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <ProfileField
        label="Training location"
        textInputProps={{
          placeholder: "gym / home / outdoor",
          value: value.trainingLocation ?? "",
          onChangeText: (t) => onChange({ ...value, trainingLocation: t }),
        }}
      />

      {/* Equipment */}
      <ProfileField
        label="Equipment (comma-separated)"
        textInputProps={{
          placeholder: "dumbbells, barbell, bands",
          value: value.equipmentAvailable ?? "",
          onChangeText: (t) => onChange({ ...value, equipmentAvailable: t }),
        }}
      />

      {/* Preferred activities */}
      <ProfileField
        label="Preferred activities (comma-separated)"
        textInputProps={{
          placeholder: "running, yoga, push pull legs",
          value: value.preferredActivities ?? "",
          onChangeText: (t) => onChange({ ...value, preferredActivities: t }),
        }}
      />

      {/* Injuries */}
      <ProfileField
        label="Injuries / limitations"
        textInputProps={{
          placeholder: "optional",
          value: value.injuriesOrLimitations ?? "",
          onChangeText: (t) => onChange({ ...value, injuriesOrLimitations: t }),
        }}
      />

      {/* Coaching style chips */}
      <Text className="text-white text-lg font-semibold mt-6 mb-3">Coaching style</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="flex-row gap-3 mb-6">
        {(["gentle", "balanced", "intense"] as const).map((k) => (
          <Chip
            key={k}
            label={k=== "gentle" ? "🧘 Gentle" : k === "balanced" ? "⚖️ Balanced" : "🔥 Intense"}
            active={(value.coachingStyle ?? "balanced") === k}
            onPress={() => onChange({ ...value, coachingStyle: k })}
          />
        ))}
      </View>

      {/* Height / Weight */}
      <Text className="text-white text-lg font-semibold mb-3">Body Stats</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="flex-row gap-3">
      <View className="flex-1">
      <ProfileField
        label="Height (cm)"
        textInputProps={{
          placeholder: "e.g. 175",
          keyboardType: "numeric",
          value: value.heightCm ?? "",
          onChangeText: (t) => onChange({ ...value, heightCm: t }),
        }}
      />
      </View>
      <View className="flex-1">
      <ProfileField
        label="Weight (kg)"
        textInputProps={{
          placeholder: "e.g. 70",
          keyboardType: "numeric",
          value: value.weightKg ?? "",
          onChangeText: (t) => onChange({ ...value, weightKg: t }),
        }}
      />
      </View>
      </View>

      {/* No buttons here — the parent screen shows the single Continue CTA */}
    </View>
  );
}
