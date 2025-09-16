import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  creating?: boolean;

  newEvent: any;
  setNewEvent: (event: any) => void;

  startTime: string;
  setStartTime: (val: any) => void;

  endTime: string;
  setEndTime: (val: any) => void;

  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;

  openEnd: boolean;
  setOpenEnd: React.Dispatch<React.SetStateAction<boolean>>;

  items: { label: string; value: string }[];
  setItems: (items: any) => void;
}

export default function TaskModal(props: TaskModalProps) {
  const {
    visible,
    onClose,
    onCreate,
    creating,
    newEvent,
    setNewEvent,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    open,
    setOpen,
    openEnd,
    setOpenEnd,
    items,
    setItems,
  } = props;

  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">(
    newEvent?.repeat || "none"
  );

  const setCategory = (c: "work" | "workout" | "meal" | "other") =>
    setNewEvent({ ...newEvent, category: c });

  const commit = () => {
    setNewEvent({ ...newEvent, repeat });
    onCreate();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 16,
            maxHeight: "82%",
          }}>
          {/* top row with close a bit lower */}
          <View style={{ alignItems: "flex-end" }}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
              <Ionicons name="close-circle" size={26} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 10,
              color: "#16a34a",
            }}>
            Create Event
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}>
            <TextInput
              placeholder="Event name*"
              placeholderTextColor="#16a34a"
              value={newEvent.title}
              onChangeText={(t) => setNewEvent({ ...newEvent, title: t })}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                color: "#065f46",
              }}
            />

            <TextInput
              placeholder="Type the note here..."
              placeholderTextColor="#16a34a"
              value={newEvent.subtitle}
              onChangeText={(t) => setNewEvent({ ...newEvent, subtitle: t })}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 12,
                borderRadius: 10,
                marginBottom: 14,
                height: 100,
                textAlignVertical: "top",
                color: "#065f46",
              }}
            />

            {/* category */}
            <Text
              style={{ fontWeight: "700", marginBottom: 6, color: "#065f46" }}>
              Category
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
              }}>
              {(["work", "workout", "meal", "other"] as const).map((c) => {
                const sel = newEvent.category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sel ? "#16a34a" : "#ddd",
                      backgroundColor: sel ? "#dcfce7" : "white",
                    }}>
                    <Text
                      style={{
                        color: "#065f46",
                        fontWeight: sel ? "800" : "600",
                      }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Start time */}
            <Text
              style={{ fontWeight: "700", marginBottom: 6, color: "#065f46" }}>
              Start time
            </Text>
            <View style={{ zIndex: 3000, marginBottom: open ? 220 : 14 }}>
              <DropDownPicker
                open={open}
                value={startTime}
                items={items}
                setOpen={setOpen}
                setValue={setStartTime}
                setItems={setItems}
                listMode="SCROLLVIEW"
                dropDownDirection="BOTTOM"
                zIndex={3000}
                zIndexInverse={1000}
                style={{ backgroundColor: "white", borderColor: "#ddd" }}
                dropDownContainerStyle={{
                  backgroundColor: "white",
                  borderColor: "#ddd",
                  maxHeight: 200,
                }}
                textStyle={{ fontSize: 14, color: "#065f46" }}
              />
            </View>

            {/* End time */}
            <Text
              style={{ fontWeight: "700", marginBottom: 6, color: "#065f46" }}>
              End time
            </Text>
            <View style={{ zIndex: 2000, marginBottom: openEnd ? 220 : 16 }}>
              <DropDownPicker
                open={openEnd}
                value={endTime}
                items={items}
                setOpen={setOpenEnd}
                setValue={setEndTime}
                setItems={setItems}
                listMode="SCROLLVIEW"
                dropDownDirection="BOTTOM"
                zIndex={2000}
                zIndexInverse={3000}
                style={{ backgroundColor: "white", borderColor: "#ddd" }}
                dropDownContainerStyle={{
                  backgroundColor: "white",
                  borderColor: "#ddd",
                  maxHeight: 200,
                }}
                textStyle={{ fontSize: 14, color: "#065f46" }}
              />
            </View>

            {/* Repeat */}
            <Text
              style={{ fontWeight: "700", marginBottom: 6, color: "#065f46" }}>
              Repeat
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {(["none", "daily", "weekly"] as const).map((r) => {
                const sel = repeat === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRepeat(r)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sel ? "#16a34a" : "#ddd",
                      backgroundColor: sel ? "#dcfce7" : "white",
                    }}>
                    <Text
                      style={{
                        color: "#065f46",
                        fontWeight: sel ? "800" : "600",
                      }}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Create / Cancel */}
            <TouchableOpacity
              disabled={creating}
              onPress={commit}
              style={{
                backgroundColor: "#F9FF6E",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 6,
                opacity: creating ? 0.6 : 1,
              }}>
              <Text style={{ fontWeight: "800", fontSize: 16, color: "black" }}>
                {creating ? "Creating..." : "Create Event"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
