import { View, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import WeeklySchedule from './WeeklySchedule';
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface WeeklyScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WeeklySchedulePopUp({ visible, onClose }: WeeklyScheduleModalProps) {
    return (
  <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose} >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#4ade80" />
          </Pressable>
          <ScrollView>
          {/* <View> */}
            <WeeklySchedule  />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    width: "98%", 
    maxHeight: "90%", 
    padding: 16,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
    zIndex: 10,
  },
});