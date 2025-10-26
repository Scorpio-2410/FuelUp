import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";

export type Fitness = {
  goal?: string; // required
  activityLevel?: string; // required
  daysPerWeek?: string; // required (1–7)
  height?: string; // "175" (cm) or "5'10" (ft)
  weight?: string; // numeric string in kg|lb
  heightUnit?: "cm" | "ft";
  weightUnit?: "kg" | "lb";
};

type Props = {
  value: Fitness;
  onChange: (v: Fitness) => void;
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
      className={`px-3 py-2 rounded-xl border ${
        active
          ? "bg-green-700 border-green-600"
          : "bg-transparent border-gray-700"
      }`}
    >
      <Text className={active ? "text-white" : "text-gray-300"}>{label}</Text>
    </Pressable>
  );
}

// Scrollable dropdown via modal
function Dropdown({
  label,
  value,
  onSelect,
  options,
}: {
  label: string;
  value: string;
  onSelect: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-300 mb-2">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3"
      >
        <Text className="text-white">{value || "Select"}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="max-h-[60%] bg-[#111] rounded-t-2xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-lg font-semibold">{label}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-green-500 text-base">Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="px-3 py-3 border-b border-gray-800"
                >
                  <Text className="text-white">{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const GOALS = [
  { key: "general_health", label: "General health" },
  { key: "fat_loss", label: "Fat loss" },
  { key: "muscle_gain", label: "Muscle gain" },
  { key: "endurance", label: "Endurance" },
  { key: "mobility", label: "Mobility" },
];

const ACTIVITY = [
  { key: "sedentary", label: "Sedentary" },
  { key: "light", label: "Light" },
  { key: "moderate", label: "Moderate" },
  { key: "active", label: "Active" },
  { key: "very_active", label: "Very active" },
];

// helpers for conversions when switching units
function inchesToLabel(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches % 12);
  return `${ft}'${inch}`;
}
function cmToFtInLabel(cm: number): string {
  if (!cm || isNaN(cm)) return "";
  const totalInches = Math.round(cm / 2.54);
  return inchesToLabel(totalInches);
}
function labelToInches(label: string): number {
  const m = String(label).match(/(\d+)\D+(\d+)/);
  if (m) {
    const ft = parseInt(m[1], 10);
    const inch = parseInt(m[2], 10);
    return ft * 12 + Math.max(0, Math.min(11, inch));
  }
  const one = String(label).match(/(\d+)/);
  if (one) return parseInt(one[1], 10) * 12;
  return NaN;
}

export default function FitnessStep({ value, onChange }: Props) {
  // Validation logic for required fields
  const errors: { [key: string]: string } = {};
  if (
    !value.daysPerWeek ||
    isNaN(Number(value.daysPerWeek)) ||
    Number(value.daysPerWeek) < 1 ||
    Number(value.daysPerWeek) > 7
  ) {
    errors.daysPerWeek = "Please select days per week (1–7).";
  }
  if (!value.height || value.height.trim().length < 1) {
    errors.height = "Height is required.";
  }
  // Remove 'Enter a valid height.' error logic
  if (!value.weight || value.weight.trim().length < 1) {
    errors.weight = "Weight is required.";
  }
  // Height dropdowns
  const heightCmOptions = useMemo(
    () => Array.from({ length: 151 }, (_, i) => String(100 + i)), // 100–250 cm
    []
  );
  const heightFtOptions = useMemo(() => {
    // 4'0 (48") through 7'11 (95")
    const opts: string[] = [];
    for (let inches = 48; inches <= 95; inches += 1) {
      opts.push(inchesToLabel(inches));
    }
    return opts;
  }, []);

  // Weight dropdown values
  const weightOptions = useMemo(() => {
    if ((value.weightUnit ?? "kg") === "kg") {
      // 40–240 kg
      return Array.from({ length: 201 }, (_, i) => String(40 + i));
    }
    // 90–490 lb
    return Array.from({ length: 401 }, (_, i) => String(90 + i));
  }, [value.weightUnit]);

  // Unit switch with conversion of current value
  const setHeightUnit = (u: "cm" | "ft") => {
    if (u === (value.heightUnit ?? "cm")) return;
    let newHeight = "";
    if (u === "ft") {
      const cm = Number(value.height);
      if (!isNaN(cm) && cm > 0) newHeight = cmToFtInLabel(cm);
    } else {
      const inches = labelToInches(value.height ?? "");
      if (!isNaN(inches) && inches > 0)
        newHeight = String(Math.round(inches * 2.54));
    }
    onChange({ ...value, heightUnit: u, height: newHeight });
  };

  // Weight unit switch with conversion of current value
  const toLb = (kgStr?: string) => {
    const kg = Number(kgStr);
    if (!kg || isNaN(kg)) return "";
    return String(Math.round(kg / 0.45359237));
  };
  const toKg = (lbStr?: string) => {
    const lb = Number(lbStr);
    if (!lb || isNaN(lb)) return "";
    return String(Math.round(lb * 0.45359237));
  };
  const setWeightUnit = (u: "kg" | "lb") => {
    if (u === (value.weightUnit ?? "kg")) return;
    let newWeight = "";
    if (u === "lb") {
      newWeight = toLb(value.weight);
    } else {
      newWeight = toKg(value.weight);
    }
    onChange({ ...value, weightUnit: u, weight: newWeight });
  };

  return (
    <View className="mt-2 mb-12">
      {/* Goal (required) */}
      <Text className="text-white text-lg font-semibold mb-3">Goal</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="flex-row flex-wrap gap-2 mb-6">
        {GOALS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            active={(value.goal ?? "general_health") === g.key}
            onPress={() => onChange({ ...value, goal: g.key })}
          />
        ))}
      </View>

      {/* Activity level (required) */}
      <Text className="text-white text-lg font-semibold mb-3">
        Activity level
      </Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <View className="flex-row flex-wrap gap-2 mb-6">
        {ACTIVITY.map((a) => (
          <Chip
            key={a.key}
            label={a.label}
            active={(value.activityLevel ?? "moderate") === a.key}
            onPress={() => onChange({ ...value, activityLevel: a.key })}
          />
        ))}
      </View>

      {/* Days per week */}
      <Text className="text-white text-lg font-semibold mb-3">
        General Info
      </Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />
      <Text className="text-gray-300 mb-2">Days / week</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {Array.from({ length: 7 }, (_, i) => `${i + 1}`).map((d) => (
          <Chip
            key={d}
            label={d}
            active={(value.daysPerWeek ?? "") === d}
            onPress={() => onChange({ ...value, daysPerWeek: d })}
          />
        ))}
      </View>
      {errors.daysPerWeek && (
        <Text
          style={{
            color: "#ef4444",
            marginTop: 0,
            marginBottom: 6,
            marginLeft: 4,
            fontSize: 13,
          }}
        >
          {errors.daysPerWeek}
        </Text>
      )}

      {/* Body Stats */}
      <Text className="text-white text-lg font-semibold mb-3">Body Stats</Text>
      <View className="h-1 w-16 bg-green-500 rounded-full mb-4" />

      <View className="flex-row gap-3">
        {/* Height */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-300">Height</Text>
            <View className="flex-row gap-2">
              <Chip
                label="CM"
                active={(value.heightUnit ?? "cm") === "cm"}
                onPress={() => setHeightUnit("cm")}
              />
              <Chip
                label="FT"
                active={(value.heightUnit ?? "cm") === "ft"}
                onPress={() => setHeightUnit("ft")}
              />
            </View>
          </View>
          {(value.heightUnit ?? "cm") === "cm" ? (
            <Dropdown
              label="Height (cm)"
              value={value.height ?? ""}
              options={heightCmOptions}
              onSelect={(v) => onChange({ ...value, height: v })}
            />
          ) : (
            <Dropdown
              label="Height (ft'in)"
              value={value.height ?? ""}
              options={heightFtOptions}
              onSelect={(v) => onChange({ ...value, height: v })}
            />
          )}
          {errors.height && (
            <Text
              style={{
                color: "#ef4444",
                marginTop: 4,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              {errors.height}
            </Text>
          )}
        </View>

        {/* Weight */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-300">Weight</Text>
            <View className="flex-row gap-2">
              <Chip
                label="KG"
                active={(value.weightUnit ?? "kg") === "kg"}
                onPress={() => setWeightUnit("kg")}
              />
              <Chip
                label="LB"
                active={(value.weightUnit ?? "kg") === "lb"}
                onPress={() => setWeightUnit("lb")}
              />
            </View>
          </View>
          <Dropdown
            label={
              (value.weightUnit ?? "kg") === "kg"
                ? "Weight (kg)"
                : "Weight (lb)"
            }
            value={value.weight ?? ""}
            options={weightOptions}
            onSelect={(v) => onChange({ ...value, weight: v })}
          />
          {errors.weight && (
            <Text
              style={{
                color: "#ef4444",
                marginTop: 4,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              {errors.weight}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
