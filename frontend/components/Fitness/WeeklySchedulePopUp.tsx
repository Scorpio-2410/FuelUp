import { View, Modal, Pressable, StyleSheet } from "react-native";
import WeeklySchedule from "./WeeklySchedule";

interface WeeklyScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WeeklySchedulePopUp({
  visible,
  onClose,
}: WeeklyScheduleModalProps) {
  // NOTE: We removed the extra “X” here to avoid two closes.
  // The only close lives inside WeeklySchedule and calls onClose().
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <WeeklySchedule onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    width: "100%",
    height: "100%", // cover whole screen
    paddingTop: 4, // pushes content a touch lower
  },
});
