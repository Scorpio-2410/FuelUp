import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import RNPickerSelect, { Item } from "react-native-picker-select";

type DropdownItem = { label: string; value: string };
type Props = {
  value: string | null; // 👈 allow null for "no selection"
  items: readonly DropdownItem[];
  onChange: (v: string | null) => void; // 👈 may return null
  placeholderLabel: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyleIOS?: TextStyle;
  inputStyleAndroid?: TextStyle;
  testID?: string;
};

export default function ProfileDropdown({
  value,
  items,
  onChange,
  placeholderLabel,
  disabled = false,
  containerStyle,
  inputStyleIOS,
  inputStyleAndroid,
  testID,
}: Props) {
  const pickerItems: Item[] = items.map((i) => ({
    label: i.label,
    value: i.value,
  }));

  return (
    <View
      testID={testID}
      className={`bg-neutral-900 border border-neutral-800 rounded-lg ${
        disabled ? "opacity-60" : ""
      }`}
      style={[{ minWidth: 100 }, containerStyle]}>
      <RNPickerSelect
        onValueChange={(v) => {
          // RNPickerSelect can deliver string | number | null
          if (typeof v === "string" || v === null) onChange(v);
        }}
        value={value ?? null} // 👈 keep null when nothing is selected
        items={pickerItems}
        disabled={disabled}
        placeholder={{ label: placeholderLabel, value: null }} // 👈 placeholder uses null
        useNativeAndroidPickerStyle={false}
        style={{
          inputIOS: {
            paddingVertical: 12,
            paddingHorizontal: 12,
            color: "white",
            ...(inputStyleIOS ?? {}),
          },
          inputAndroid: {
            paddingVertical: 8,
            paddingHorizontal: 12,
            color: "white",
            ...(inputStyleAndroid ?? {}),
          },
          placeholder: { color: "#9CA3AF" },
          iconContainer: { top: 14, right: 12 },
        }}
        Icon={() => <Text style={{ color: "#9CA3AF" }}>▾</Text>}
      />
    </View>
  );
}
