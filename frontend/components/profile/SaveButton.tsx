import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  saving: boolean;
  onSave: () => Promise<void>;
};

export default function SaveButton({ saving, onSave }: Props) {
  return (
    <Pressable
      onPress={onSave}
      disabled={saving}
      className={`rounded-xl p-3 ${saving ? "bg-blue-400" : "bg-blue-600"}`}
      accessibilityRole="button"
      accessibilityLabel="Save profile">
      <Text className="text-white text-center font-semibold">
        {saving ? "Saving…" : "Save"}
      </Text>
    </Pressable>
  );
}
