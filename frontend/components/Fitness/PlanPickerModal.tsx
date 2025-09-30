// components/Fitness/PlanPickerModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";

type Props = {
  visible: boolean;
  plans: Array<{ id: string; name: string }>;
  onClose: () => void;
  onPick: (planId: string) => void;
};

export default function PlanPickerModal({
  visible,
  plans,
  onClose,
  onPick,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}>
        <SafeAreaView
          style={{
            backgroundColor: "#0a0a0a",
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 18,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}>
          <View
            style={{
              alignSelf: "center",
              width: 44,
              height: 5,
              backgroundColor: "#27272a",
              borderRadius: 3,
              marginBottom: 10,
            }}
          />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 10,
            }}>
            Add to plan
          </Text>

          <FlatList
            data={plans}
            keyExtractor={(x) => String(x.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onPick(String(item.id))}
                style={{
                  backgroundColor: "#171717",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#262626",
                }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#9CA3AF" }}>
                You don’t have any plans yet. Create one from the Fitness tab.
              </Text>
            }
          />

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 10,
              alignSelf: "center",
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}>
            <Text style={{ color: "#9CA3AF", fontWeight: "700" }}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
