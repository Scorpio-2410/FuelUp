import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type Recurrence = { freq: "none" | "daily" | "weekly"; daysOfWeek?: number[] }; // 0=Sun..6=Sat

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
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

  const [recurrence, setRecurrence] = useState<Recurrence>({ freq: "none" }); // recurrence local state

  const toggleDow = (i: number) => {
    const cur = new Set(recurrence.daysOfWeek || []);
    cur.has(i) ? cur.delete(i) : cur.add(i);
    setRecurrence({ ...recurrence, daysOfWeek: Array.from(cur).sort() });
  };

  const applyCreate = () => {
    setNewEvent({ ...newEvent, recurrence }); // attach recurrence before create
    onCreate();
    setRecurrence({ freq: "none" }); // reset
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
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
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            height: "78%",
          }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 16,
              color: "green",
              textAlign: "center",
            }}>
            Create Event
          </Text>

          {/* Title */}
          <TextInput
            placeholder="Event name*"
            placeholderTextColor="green"
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              color: "green",
            }}
          />

          {/* Notes */}
          <TextInput
            placeholder="Type the note here..."
            placeholderTextColor="green"
            value={newEvent.subtitle}
            onChangeText={(text) =>
              setNewEvent({ ...newEvent, subtitle: text })
            }
            multiline
            numberOfLines={4}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              height: 90,
              textAlignVertical: "top",
              color: "green",
            }}
          />

          {/* Category */}
          <Text style={{ marginBottom: 6, fontWeight: "bold", color: "green" }}>
            Category
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {["work", "personal", "outing", "gym"].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{
                  backgroundColor:
                    newEvent.category === cat ? "#4ade80" : "gray",
                  padding: 10,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => setNewEvent({ ...newEvent, category: cat })}>
                <Text style={{ color: "white", fontWeight: "600" }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recurrence */}
          <Text style={{ marginBottom: 6, fontWeight: "bold", color: "green" }}>
            Repeat
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {(["none", "daily", "weekly"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setRecurrence({ freq: f })}
                style={{
                  backgroundColor: recurrence.freq === f ? "#4ade80" : "#ddd",
                  padding: 8,
                  borderRadius: 8,
                  marginRight: 8,
                }}>
                <Text
                  style={{ color: recurrence.freq === f ? "black" : "black" }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekday picker when weekly */}
          {recurrence.freq === "weekly" && (
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                const on = (recurrence.daysOfWeek || []).includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleDow(i)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: on ? "#4ade80" : "#eee",
                      marginRight: 8,
                    }}>
                    <Text
                      style={{
                        color: on ? "black" : "black",
                        fontWeight: "600",
                      }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Start Time */}
          <View
            style={{
              zIndex: 2000,
              elevation: 2000,
              marginBottom: open ? 180 : 12,
            }}>
            <Text
              style={{ marginBottom: 4, fontWeight: "bold", color: "green" }}>
              Start time
            </Text>
            <DropDownPicker
              open={open}
              value={startTime}
              items={items}
              setOpen={setOpen}
              setValue={setStartTime}
              setItems={setItems}
              containerStyle={{ marginBottom: 12 }}
              style={{ backgroundColor: "white", borderColor: "#ccc" }}
              dropDownContainerStyle={{ backgroundColor: "white" }}
              textStyle={{ fontSize: 14, color: "green" }}
            />
          </View>

          {/* End Time */}
          <View style={{ zIndex: 3000, elevation: 3000, marginBottom: 10 }}>
            <Text
              style={{ marginBottom: 4, fontWeight: "bold", color: "green" }}>
              End time
            </Text>
            <DropDownPicker
              open={openEnd}
              value={endTime}
              items={items}
              setOpen={setOpenEnd}
              setValue={setEndTime}
              setItems={setItems}
              containerStyle={{ marginBottom: 12 }}
              style={{ backgroundColor: "white", borderColor: "#ccc" }}
              dropDownContainerStyle={{ backgroundColor: "white" }}
              textStyle={{ fontSize: 14, color: "green" }}
            />
          </View>

          {/* Create */}
          <TouchableOpacity
            onPress={applyCreate}
            style={{
              backgroundColor: "#F9FF6E",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 14,
            }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "black" }}>
              Create Event
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            style={{ marginTop: 14, alignItems: "center" }}>
            <Text style={{ color: "red" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
