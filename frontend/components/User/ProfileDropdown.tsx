import React, { useState } from "react";
import { View, ViewStyle, TextStyle } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

type DropdownItem = { label: string; value: string };
type Props = {
  value: string;
  items: readonly DropdownItem[];
  onChange: (v: string) => void;
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
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  // Convert items for DropDownPicker
  const pickerItems = items.map((i) => ({ label: i.label, value: i.value }));

  // Sync external value
  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  return (
    <View
      testID={testID}
      style={[{ minWidth: 100, zIndex: open ? 1000 : 1 }, containerStyle]}
    >
      <DropDownPicker
        open={open}
        value={selectedValue}
        items={pickerItems}
        setOpen={setOpen}
        setValue={(cb) => {
          const v = typeof cb === "function" ? cb(selectedValue) : cb;
          setSelectedValue(v);
          if (typeof v === "string") onChange(v);
        }}
        placeholder={placeholderLabel}
        disabled={disabled}
        listMode="SCROLLVIEW"
        style={{
          backgroundColor: "#171717",
          borderColor: "#262626",
          borderRadius: 8,
          minHeight: 44,
        }}
        textStyle={{ color: "white" }}
        placeholderStyle={{ color: "#9CA3AF" }}
        dropDownContainerStyle={{
          backgroundColor: "#171717",
          borderColor: "#262626",
          zIndex: 1000,
        }}
        listItemLabelStyle={{ color: "white" }}
        selectedItemLabelStyle={{ color: "#22d3ee" }}
        disabledStyle={{ opacity: 0.6 }}
        zIndex={1000}
      />
    </View>
  );
}
