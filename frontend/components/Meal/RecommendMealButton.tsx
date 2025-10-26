import React, { useState, useRef } from "react";
import {
  Pressable,
  Text,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FoodRecommendations from "./FoodRecommendations";

type Props = {
  onClose?: () => void;
  onOpen?: () => void;
};

export default function RecommendMealButton({ onClose, onOpen }: Props) {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<"form"|"results">("form");
  const [inventory, setInventory] = useState<Array<{ name: string; qty?: number; unit?: string }>>([]);
  const [unitPickerOpenIndex, setUnitPickerOpenIndex] = useState<number | null>(null);
  const UNIT_OPTIONS = ["", "g", "kg", "pcs", "pc", "ml", "l", "cup", "tbsp", "tsp"];
  const [translateY, setTranslateY] = useState(0);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward drag
      if (gestureState.dy > 0) setTranslateY(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 120) {
        // user swiped down -> close
        close();
      }
      setTranslateY(0);
    },
  })).current;

  function open() {
    setVisible(true);
    setStage("form");
    // ensure at least one row is present
    setInventory((cur) => (cur.length ? cur : [{ name: "", qty: undefined, unit: "" }]));
  }

  function close() {
    setVisible(false);
    setStage("form");
    onClose?.();
  }

  // helper to update one ingredient row
  function updateRow(idx: number, patch: Partial<{ name: string; qty?: number; unit?: string }>) {
    setInventory((cur) => {
      const copy = cur.slice();
      copy[idx] = { ...(copy[idx] || { name: "", qty: undefined, unit: "" }), ...patch };
      return copy;
    });
  }

  function addRow() {
    setInventory((cur) => [...cur, { name: "", qty: undefined, unit: "" }]);
  }

  function removeRow(idx: number) {
    setInventory((cur) => cur.filter((_, i) => i !== idx));
  }

  return (
    <>
      <Pressable
        onPress={open}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#10B981",
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 16,
          marginHorizontal: 16,
          marginTop: 12,
          gap: 10,
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="bulb" size={22} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
          Recommend a Meal
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            {...panResponder.panHandlers}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "flex-end",
              transform: [{ translateY }],
            }}
          >
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "90%",
                transform: [{ translateY }],
              }}
            >
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
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
                  Recommend a Meal
                </Text>
                <Pressable onPress={close} style={{ padding: 4 }}>
                  <Ionicons name="close" size={28} color="#9ca3af" />
                </Pressable>
              </View>

              {/* Step 1: ingredient form */}
              {stage === "form" && (
                <View style={{ padding: 16, maxHeight: "80%" }}>
                  <Text style={{ color: "#d1d5db", marginBottom: 8 }}>
                    Enter the ingredients you have (name, amount, unit). Add as many as you like.
                  </Text>
                  <View style={{ gap: 8 }}>
                    {inventory.map((row, i) => (
                      <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <Text style={{ color: "#d1d5db", width: 28 }}>{i+1}.</Text>
                        <View style={{ flex: 1 }}>
                          <TextInput
                            placeholder="e.g., chicken breast"
                            placeholderTextColor="#6b7280"
                            value={row.name}
                            onChangeText={(t: string) => updateRow(i, { name: t })}
                            style={{ backgroundColor: "#262626", color: "#fff", borderRadius: 8, padding: 8 }}
                          />
                        </View>
                        <View style={{ width: 80 }}>
                          <TextInput
                            placeholder="qty"
                            placeholderTextColor="#6b7280"
                            keyboardType="numeric"
                            value={row.qty != null ? String(row.qty) : ""}
                            onChangeText={(t: string) => updateRow(i, { qty: t ? Number(t) : undefined })}
                            style={{ backgroundColor: "#262626", color: "#fff", borderRadius: 8, padding: 8 }}
                          />
                        </View>
                        <View style={{ width: 110 }}>
                          <Pressable
                            onPress={() => setUnitPickerOpenIndex(unitPickerOpenIndex === i ? null : i)}
                            style={{ backgroundColor: '#262626', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, minHeight: 40, justifyContent: 'center' }}
                          >
                            <Text style={{ color: row.unit ? '#fff' : '#9ca3af' }}>{row.unit ? row.unit : 'unit'}</Text>
                          </Pressable>
                          {unitPickerOpenIndex === i && (
                            <View style={{ position: 'relative', marginTop: 6, backgroundColor: '#111827', borderRadius: 8, borderWidth: 1, borderColor: '#263244', overflow: 'hidden' }}>
                              {UNIT_OPTIONS.map((opt) => (
                                <Pressable key={opt || 'none'} onPress={() => { updateRow(i, { unit: opt }); setUnitPickerOpenIndex(null); }} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
                                  <Text style={{ color: opt ? '#fff' : '#9ca3af' }}>{opt ? opt : 'unit'}</Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                        <Pressable onPress={() => removeRow(i)} style={{ padding: 8 }}>
                          <Ionicons name="trash" size={20} color="#ef4444" />
                        </Pressable>
                      </View>
                    ))}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Pressable onPress={addRow} style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 10, alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700' }}>Add ingredient</Text>
                        </Pressable>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Pressable onPress={() => { setStage('results'); onOpen?.(); }} style={{ backgroundColor: inventory.length ? '#10B981' : '#374151', padding: 12, borderRadius: 10, alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 2: results */}
              {stage === "results" && (
                <View style={{ maxHeight: "80%" }}>
                  <FoodRecommendations inventory={inventory} />
                  <View style={{ padding: 12, flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => setStage("form")} style={{ flex: 1, backgroundColor: "#374151", padding: 12, borderRadius: 10, alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Back</Text>
                    </Pressable>
                    <Pressable onPress={close} style={{ flex: 1, backgroundColor: "#2563eb", padding: 12, borderRadius: 10, alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
