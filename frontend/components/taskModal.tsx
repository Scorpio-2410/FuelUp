import React from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

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
  setOpen: (val: boolean) => void;
  openEnd: boolean;
  setOpenEnd: (val: boolean) => void;
  items: { label: string; value: string }[];
  setItems: (items: any) => void;
}

export default function TaskModal({
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
}: TaskModalProps) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
        style={{
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        height: "60%", }}>
    <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "green", textAlign: "center" }}>
      Create Event
    </Text>

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
      }}/>

    {/* Notes */}
    <TextInput
      placeholder="Type the note here..."
      placeholderTextColor="green"
      value={newEvent.subtitle}
      onChangeText={(text) => setNewEvent({ ...newEvent, subtitle: text })}
      multiline
      numberOfLines={4}
      style={{
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        height: 100, 
        textAlignVertical: "top",
        color: "green",}}/>

    {/* Start Time */}
    <View style={{ zIndex: 2000, elevation: 2000,marginBottom: open ? 180 : 12  }}>  
    <Text style={{ marginBottom: 4, fontWeight: "bold", color: "green" }}>Start time</Text>
    <DropDownPicker
      open={open}
      value={startTime}
      items={items}
      setOpen={setOpen}
      setValue={setStartTime}
      setItems={setItems}
      containerStyle={{ marginBottom: 12 }}
      style={{ backgroundColor: "white", borderColor: "#ccc" }}
      dropDownContainerStyle={{ backgroundColor: "white"}}
      textStyle={{ fontSize: 14, color: "green" }}/>
      </View>

    {/* End Time */}
    <View style={{ zIndex: 3000, elevation: 3000, marginBottom: 10 }}>
    <Text style={{ marginBottom: 4, fontWeight: "bold", color: "green" }}>End time</Text>
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
      textStyle={{ fontSize: 14, color: "green" }}/>
      </View>

    {/* Create button */}
    <TouchableOpacity
      onPress={onCreate}
      style={{
        backgroundColor: "#F9FF6E",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20, }}>
      <Text style={{ fontWeight: "bold", fontSize: 16, color: "black" }}>Create Event</Text>
    </TouchableOpacity>

    {/* Cancel */}
    <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: "red" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
    );
}