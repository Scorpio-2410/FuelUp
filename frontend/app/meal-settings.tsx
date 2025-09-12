// app/meal-settings.tsx (or app/(modals)/meal-settings.tsx if you prefer a modal route)
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";

const STORAGE_KEY = "meal_settings_v1";
const OTHER = "__OTHER__";

type MealSettings = {
  diet: string; // value or OTHER
  dietOther?: string;
  allergies: string[]; // multi
  intolerances: string[]; // multi
  dislikes: string[]; // multi
  spice: "None" | "Mild" | "Medium" | "Hot";
  cuisines: string[]; // multi
  goal: string; // value or OTHER
  goalOther?: string;
  caloriesMode: "Auto" | "Custom";
  customCalories?: string; // store as string to keep input happy
  timePerMeal: "≤10" | "15–25" | "30–45" | ">45";
  equipment: string[]; // multi
  servings: "1" | "2" | "3–5";
};

const dietOptions = [
  "Halal",
  "Kosher",
  "Vegan",
  "Vegetarian (lacto-ovo)",
  "Pescatarian",
  "Jain (no onion/garlic)",
  "No beef",
  "No pork",
  "None",
];
const allergyOptions = [
  "Peanuts",
  "Tree nuts",
  "Sesame",
  "Soy",
  "Dairy",
  "Eggs",
  "Wheat/Gluten",
  "Fish",
  "Shellfish",
  "Sulfites",
  "Mustard",
  "Celery",
  "Nightshades",
];
const intoleranceOptions = ["Lactose", "Gluten", "FODMAP", "None"];
const cuisineOptions = [
  "South Asian",
  "East Asian",
  "Southeast Asian",
  "Middle Eastern",
  "Mediterranean",
  "African",
  "Latin American",
  "European",
  "American",
];
const goalOptions = [
  "Lose weight",
  "Maintain",
  "Gain muscle",
  "Balanced/General",
  "Heart-healthy",
  "Diabetes-friendly",
  "Low sodium",
  "Low carb",
  "High protein",
];
const timeOptions: MealSettings["timePerMeal"][] = [
  "≤10",
  "15–25",
  "30–45",
  ">45",
];
const equipmentOptions = [
  "Stove",
  "Oven",
  "Microwave",
  "Air fryer",
  "Rice cooker",
  "Pressure cooker",
  "Blender",
  "BBQ/Grill",
];
const spiceOptions: MealSettings["spice"][] = ["None", "Mild", "Medium", "Hot"];
const servingsOptions: MealSettings["servings"][] = ["1", "2", "3–5"];

export default function MealSettingsScreen() {
  const [footerH, setFooterH] = useState(0);
  const router = useRouter();
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<MealSettings>({
    diet: "",
    allergies: [],
    intolerances: [],
    dislikes: [],
    spice: "Medium",
    cuisines: [],
    goal: "",
    caloriesMode: "Auto",
    timePerMeal: "15–25",
    equipment: [],
    servings: "1",
  });
  const initialRef = React.useRef<MealSettings | null>(null);

  const hasChanges = React.useMemo(() => {
    if (!initialRef.current) return false;
    // Safe here because your settings are strings/arrays only
    return JSON.stringify(initialRef.current) !== JSON.stringify(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings));
    } finally {
      setSaving(false);

      if (Platform.OS === "android") {
        // toast + go back
        ToastAndroid.show("Preferences saved", ToastAndroid.SHORT);
        router.back();
      } else {
        // iOS/web: alert with OK, then go back
        Alert.alert("Preferences saved", "", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    }
  };

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e) => {
      if (!hasChanges) return; // nothing to guard
      e.preventDefault(); // block default back

      Alert.alert("Discard changes?", "You have unsaved edits.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action), // proceed with back
        },
        { text: "Save", onPress: () => handleSave() }, // your existing save flow
      ]);
    });

    return sub; // cleanup on unmount
  }, [navigation, hasChanges, handleSave]);

  const handleBack = React.useCallback(() => {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      "Unsaved changes",
      "Do you want to save before leaving?",
      [
        { text: "No", style: "destructive", onPress: () => router.back() },
        {
          text: "Yes",
          onPress: () => {
            handleSave();
          },
        },
      ],
      { cancelable: true }
    );
  }, [hasChanges, handleSave]);

  // Load saved settings once
  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      setSettings((prev) => {
        const merged = raw ? { ...prev, ...JSON.parse(raw) } : prev;
        if (!initialRef.current) initialRef.current = merged; // snapshot
        return merged;
      });
    })();
  }, []);

  // Save on change (autosave). Replace with a Save button if you prefer.
  // useEffect(() => {
  //   SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings));
  // }, [settings]);

  const toggleMulti = (key: keyof MealSettings, value: string) => {
    setSettings((prev) => {
      const arr = (prev[key] as string[]) ?? [];
      const next = arr.includes(value)
        ? arr.filter((x) => x !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: footerH + 24,
          paddingHorizontal: 24,
          gap: 24,
        }}
        style={{ flex: 1, backgroundColor: "#1a1a1a" }}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Dietary rules">
          <Label>Diet pattern</Label>
          <DropdownWithOther
            value={settings.diet}
            otherValue={settings.dietOther}
            setValue={(v) =>
              setSettings((s) => ({
                ...s,
                diet: v,
                ...(v !== OTHER ? { dietOther: "" } : {}),
              }))
            }
            setOtherValue={(v) => setSettings((s) => ({ ...s, dietOther: v }))}
            options={dietOptions}
          />
        </Section>

        <Section title="Allergies & strict avoids">
          <Chips
            options={allergyOptions}
            selected={settings.allergies}
            onToggle={(v) => toggleMulti("allergies", v)}
          />
          <OtherInline
            label="Other allergy"
            value={
              settings.allergies
                .find((a) => a.startsWith("Other: "))
                ?.replace("Other: ", "") || ""
            }
            onChange={(txt) => {
              setSettings((s) => ({
                ...s,
                allergies: [
                  ...s.allergies.filter((a) => !a.startsWith("Other: ")),
                  ...(txt ? [`Other: ${txt}`] : []),
                ],
              }));
            }}
          />
        </Section>

        <Section title="Intolerances & dislikes">
          <Label>Intolerances</Label>
          <Chips
            options={intoleranceOptions}
            selected={settings.intolerances}
            onToggle={(v) => toggleMulti("intolerances", v)}
          />
          <Label style={{ marginTop: 12 }}>Disliked ingredients</Label>
          <TokenInput
            tokens={settings.dislikes}
            onChange={(tokens) =>
              setSettings((s) => ({ ...s, dislikes: tokens }))
            }
            placeholder="Add an ingredient and press Enter"
          />
          <Label style={{ marginTop: 12 }}>Spice level</Label>
          <Chips
            options={spiceOptions}
            selected={[settings.spice]}
            single
            onToggle={(v) =>
              setSettings((s) => ({ ...s, spice: v as MealSettings["spice"] }))
            }
          />
        </Section>

        <Section title="Cuisine preferences">
          <Chips
            options={cuisineOptions}
            selected={settings.cuisines}
            onToggle={(v) => toggleMulti("cuisines", v)}
          />
          <OtherInline
            label="Other cuisine"
            value={
              settings.cuisines
                .find((c) => c.startsWith("Other: "))
                ?.replace("Other: ", "") || ""
            }
            onChange={(txt) => {
              setSettings((s) => ({
                ...s,
                cuisines: [
                  ...s.cuisines.filter((c) => !c.startsWith("Other: ")),
                  ...(txt ? [`Other: ${txt}`] : []),
                ],
              }));
            }}
          />
        </Section>

        <Section title="Goals & targets">
          <Label>Goal</Label>
          <DropdownWithOther
            value={settings.goal}
            otherValue={settings.goalOther}
            setValue={(v) =>
              setSettings((s) => ({
                ...s,
                goal: v,
                ...(v !== OTHER ? { goalOther: "" } : {}),
              }))
            }
            setOtherValue={(v) => setSettings((s) => ({ ...s, goalOther: v }))}
            options={goalOptions}
          />
          <Label style={{ marginTop: 12 }}>Calories</Label>
          <Chips
            options={["Auto", "Custom"]}
            selected={[settings.caloriesMode]}
            single
            onToggle={(v) =>
              setSettings((s) => ({
                ...s,
                caloriesMode: v as MealSettings["caloriesMode"],
              }))
            }
          />
          {settings.caloriesMode === "Custom" && (
            <TextInput
              keyboardType="numeric"
              placeholder="e.g., 2200"
              value={settings.customCalories || ""}
              onChangeText={(t) =>
                setSettings((s) => ({ ...s, customCalories: t }))
              }
              style={ti}
              placeholderTextColor="#888"
            />
          )}
        </Section>

        <Section title="Practical constraints">
          <Label>Time per meal</Label>
          <Chips
            options={timeOptions}
            selected={[settings.timePerMeal]}
            single
            onToggle={(v) =>
              setSettings((s) => ({
                ...s,
                timePerMeal: v as MealSettings["timePerMeal"],
              }))
            }
          />
          <Label style={{ marginTop: 12 }}>Equipment</Label>
          <Chips
            options={equipmentOptions}
            selected={settings.equipment}
            onToggle={(v) => toggleMulti("equipment", v)}
          />
          <Label style={{ marginTop: 12 }}>Servings</Label>
          <Chips
            options={servingsOptions}
            selected={[settings.servings]}
            single
            onToggle={(v) =>
              setSettings((s) => ({
                ...s,
                servings: v as MealSettings["servings"],
              }))
            }
          />
        </Section>
        {/* <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Pressable
            onPress={handleSave}
            style={{
              flex: 1, // ⟵ take the other half
              backgroundColor: "#383934ff",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffffff", fontWeight: "700" }}>
              Discard Changes
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1, // ⟵ take half the row
              backgroundColor: saving ? "#9acd32" : "#bbf246",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View> */}
      </ScrollView>
      <FooterActions
        onSave={handleSave}
        onDiscardConfirm={() => router.back()} // or reset state
        dirty={hasChanges} // optional: pass a boolean to enable/disable buttons
        onHeightChange={setFooterH}
      />
    </View>
  );
}

/* ---------- UI helpers ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16 }}>
      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Label({ children, style }: any) {
  return (
    <Text style={[{ color: "#ddd", marginBottom: 6 }, style]}>{children}</Text>
  );
}

function FooterActions({
  dirty,
  onSave,
  onDiscardConfirm,
  onHeightChange,
}: {
  dirty: boolean;
  onSave: () => void;
  onDiscardConfirm: () => void; // what to do after user confirms discard
  onHeightChange?: (h: number) => void;
}) {
  const insets = useSafeAreaInsets();

  const confirmDiscard = () => {
    // No local alert. Let the `beforeRemove` guard show the single prompt.
    onDiscardConfirm();
  };
  return (
    <View
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 12,
        paddingTop: 12,
        backgroundColor: "#1a1a1a",
        borderTopWidth: 1,
        borderTopColor: "#2a2a2a",
        gap: 8,
      }}
    >
      <Text style={{ color: dirty ? "#ffd666" : "#9aa0a6", fontSize: 12 }}>
        {dirty ? "Unsaved changes" : "All changes saved"}
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={onDiscardConfirm}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            borderWidth: 1,
            borderColor: dirty ? "#555" : "#333",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={onSave}
          disabled={!dirty}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: dirty ? "#bbf246" : "#5a6a3a",
          }}
        >
          <Text style={{ color: "#000", fontWeight: "700" }}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DropdownWithOther({
  value,
  otherValue,
  setValue,
  setOtherValue,
  options,
}: {
  value: string;
  otherValue?: string;
  setValue: (v: string) => void;
  setOtherValue: (v: string) => void;
  options: string[];
}) {
  return (
    <View style={{ backgroundColor: "#1f1f1f", borderRadius: 8 }}>
      <Picker
        selectedValue={value}
        onValueChange={setValue}
        dropdownIconColor="#fff"
        style={{ color: "white" }}
      >
        <Picker.Item label="Select..." value="" />
        {options.map((opt) => (
          <Picker.Item key={opt} label={opt} value={opt} />
        ))}
        <Picker.Item label="Other…" value={OTHER} />
      </Picker>
      {value === OTHER && (
        <TextInput
          placeholder="Type your answer"
          value={otherValue || ""}
          onChangeText={setOtherValue}
          style={[ti, { margin: 12 }]}
          placeholderTextColor="#888"
        />
      )}
    </View>
  );
}

function Chips({
  options,
  selected,
  onToggle,
  single = false,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => {
              if (single) {
                onToggle(opt);
              } else {
                onToggle(opt);
              }
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: isOn ? "#bbf246" : "#3a3a3a",
            }}
          >
            <Text style={{ color: isOn ? "#000" : "#fff" }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OtherInline({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      {label ? (
        <Text style={{ color: "#ddd", marginBottom: 6 }}>{label}</Text>
      ) : null}
      <TextInput
        placeholder="Type your answer"
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChange}
        style={{
          backgroundColor: "#1f1f1f",
          color: "white",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
        }}
      />
    </View>
  );
}

function TokenInput({
  tokens,
  onChange,
  placeholder,
}: {
  tokens: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {tokens.map((t, i) => (
          <Pressable
            key={t + i}
            onPress={() => onChange(tokens.filter((x) => x !== t))}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: "#3a3a3a",
            }}
          >
            <Text style={{ color: "#fff" }}>{t} ✕</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => {
          const v = text.trim();
          if (!v) return;
          onChange([...tokens, v]);
          setText("");
        }}
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={ti}
        returnKeyType="done"
      />
    </View>
  );
}

const ti = {
  backgroundColor: "#1f1f1f",
  color: "white",
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 8,
} as const;

const btn = {
  backgroundColor: "#bbf246",
  borderRadius: 10,
  alignItems: "center",
  padding: 14,
} as const;
