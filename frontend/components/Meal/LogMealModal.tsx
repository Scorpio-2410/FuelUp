// frontend/components/Meal/LogMealModal.tsx
import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiLogMeal } from "../../constants/api";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  prefillData?: {
    name?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    serving_size?: number;
    serving_unit?: string;
  };
};

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: "sunny" as const },
  { value: "lunch", label: "Lunch", icon: "restaurant" as const },
  { value: "dinner", label: "Dinner", icon: "moon" as const },
  { value: "snack", label: "Snack", icon: "fast-food" as const },
  { value: "other", label: "Other", icon: "nutrition" as const },
];

const SERVING_UNITS = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "L",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "serving",
];

export default function LogMealModal({
  visible,
  onClose,
  onSuccess,
  onError,
  prefillData,
}: Props) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack" | "other"
  >("other");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("g");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Prefill form when modal opens with prefill data
  useEffect(() => {
    if (visible && prefillData) {
      if (prefillData.name) setName(prefillData.name);
      if (prefillData.calories)
        setCalories(String(Math.round(prefillData.calories)));
      if (prefillData.protein_g)
        setProtein(String(Math.round(prefillData.protein_g)));
      if (prefillData.carbs_g)
        setCarbs(String(Math.round(prefillData.carbs_g)));
      if (prefillData.fat_g) setFat(String(Math.round(prefillData.fat_g)));
      if (prefillData.serving_size)
        setServingSize(String(Math.round(prefillData.serving_size)));
      if (prefillData.serving_unit) setServingUnit(prefillData.serving_unit);
    }
  }, [visible, prefillData]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      onError?.("Please enter a meal name");
      return;
    }

    setLoading(true);
    try {
      await apiLogMeal({
        name: name.trim(),
        meal_type: mealType,
        calories: calories ? Number(calories) : undefined,
        protein_g: protein ? Number(protein) : undefined,
        carbs_g: carbs ? Number(carbs) : undefined,
        fat_g: fat ? Number(fat) : undefined,
        serving_size: servingSize ? Number(servingSize) : undefined,
        serving_unit: servingUnit,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setName("");
      setMealType("other");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setServingSize("");
      setServingUnit("g");
      setNotes("");

      onSuccess?.();
      onClose();
    } catch (error: any) {
      onError?.(error?.message || "Failed to log meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "90%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "800",
                }}
              >
                Log Meal
              </Text>
              <Pressable onPress={onClose} style={{ padding: 4 }}>
                <Ionicons name="close" size={28} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: "80%" }}
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Meal Name */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Meal Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Grilled Chicken Salad"
                  placeholderTextColor="#6b7280"
                  style={{
                    backgroundColor: "#262626",
                    color: "#fff",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: "#374151",
                  }}
                />
              </View>

              {/* Meal Type */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Meal Type
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {MEAL_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setMealType(type.value as any)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor:
                          mealType === type.value ? "#2563eb" : "#262626",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor:
                          mealType === type.value ? "#3b82f6" : "#374151",
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name={type.icon}
                        size={16}
                        color={mealType === type.value ? "#fff" : "#9ca3af"}
                      />
                      <Text
                        style={{
                          color: mealType === type.value ? "#fff" : "#9ca3af",
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Serving Size */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Serving Size
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={servingSize}
                    onChangeText={setServingSize}
                    placeholder="Amount"
                    placeholderTextColor="#6b7280"
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      backgroundColor: "#262626",
                      color: "#fff",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "#374151",
                    }}
                  />
                  <Pressable
                    onPress={() => setShowUnitPicker(!showUnitPicker)}
                    style={{
                      backgroundColor: "#262626",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: "#374151",
                      minWidth: 100,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      {servingUnit}
                    </Text>
                  </Pressable>
                </View>

                {/* Unit Picker Dropdown */}
                {showUnitPicker && (
                  <View
                    style={{
                      marginTop: 8,
                      backgroundColor: "#262626",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#374151",
                      maxHeight: 150,
                    }}
                  >
                    <ScrollView>
                      {SERVING_UNITS.map((unit) => (
                        <Pressable
                          key={unit}
                          onPress={() => {
                            setServingUnit(unit);
                            setShowUnitPicker(false);
                          }}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "#374151",
                          }}
                        >
                          <Text
                            style={{
                              color:
                                servingUnit === unit ? "#2563eb" : "#d1d5db",
                              fontWeight: servingUnit === unit ? "700" : "400",
                            }}
                          >
                            {unit}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Nutrition Info */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Nutrition (Optional)
                </Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#9ca3af",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        Calories
                      </Text>
                      <TextInput
                        value={calories}
                        onChangeText={setCalories}
                        placeholder="0"
                        placeholderTextColor="#6b7280"
                        keyboardType="number-pad"
                        style={{
                          backgroundColor: "#262626",
                          color: "#fff",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 15,
                          borderWidth: 1,
                          borderColor: "#374151",
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#9ca3af",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        Protein (g)
                      </Text>
                      <TextInput
                        value={protein}
                        onChangeText={setProtein}
                        placeholder="0"
                        placeholderTextColor="#6b7280"
                        keyboardType="decimal-pad"
                        style={{
                          backgroundColor: "#262626",
                          color: "#fff",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 15,
                          borderWidth: 1,
                          borderColor: "#374151",
                        }}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#9ca3af",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        Carbs (g)
                      </Text>
                      <TextInput
                        value={carbs}
                        onChangeText={setCarbs}
                        placeholder="0"
                        placeholderTextColor="#6b7280"
                        keyboardType="decimal-pad"
                        style={{
                          backgroundColor: "#262626",
                          color: "#fff",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 15,
                          borderWidth: 1,
                          borderColor: "#374151",
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#9ca3af",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        Fat (g)
                      </Text>
                      <TextInput
                        value={fat}
                        onChangeText={setFat}
                        placeholder="0"
                        placeholderTextColor="#6b7280"
                        keyboardType="decimal-pad"
                        style={{
                          backgroundColor: "#262626",
                          color: "#fff",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 15,
                          borderWidth: 1,
                          borderColor: "#374151",
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Notes (Optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: "#262626",
                    color: "#fff",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: "#374151",
                    textAlignVertical: "top",
                  }}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: "#262626",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#374151",
                }}
              >
                <Text
                  style={{ color: "#9ca3af", fontWeight: "700", fontSize: 16 }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={loading || !name.trim()}
                style={{
                  flex: 1,
                  backgroundColor:
                    loading || !name.trim() ? "#374151" : "#22c55e",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                    >
                      Log Meal
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
