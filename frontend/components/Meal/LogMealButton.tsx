// frontend/components/Meal/LogMealButton.tsx
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LogMealModal from "./LogMealModal";

type Props = {
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

export default function LogMealButton({
  onSuccess,
  onError,
  prefillData,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#57B9FF",
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 16,
          marginHorizontal: 16,
          marginTop: 16,
          gap: 10,
          shadowColor: "#22c55e",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          {prefillData?.name ? "Log This Meal" : "Log a Meal"}
        </Text>
      </Pressable>

      <LogMealModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          onSuccess?.();
        }}
        onError={(error) => {
          onError?.(error);
        }}
        prefillData={prefillData}
      />
    </>
  );
}
