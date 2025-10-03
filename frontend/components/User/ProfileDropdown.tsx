import React from "react";
import { View, Text, ViewStyle, TextStyle, TouchableOpacity } from "react-native";
import RNPickerSelect, { Item } from "react-native-picker-select";

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
  const pickerRef = React.useRef<any>(null);
  const pickerItems: Item[] = items.map((i) => ({
    label: i.label,
    value: i.value,
  }));

  const displayValue = items.find(i => i.value === value)?.label || placeholderLabel;
  const isPlaceholder = !value || !items.find(i => i.value === value);

  return (
    <TouchableOpacity
      testID={testID}
      onPress={() => {
        if (!disabled && pickerRef.current) {
          pickerRef.current.togglePicker(true);
        }
      }}
      activeOpacity={0.7}
      disabled={disabled}
      className={`bg-gray-900/50 border border-gray-800/50 rounded-xl ${
        disabled ? "opacity-60" : ""
      }`}
      style={[{ minWidth: 100 }, containerStyle]}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text 
          className={`text-base font-medium flex-1 ${
            isPlaceholder ? "text-gray-500" : "text-white"
          }`}
          numberOfLines={1}>
          {displayValue}
        </Text>
        <Text className="text-purple-500 text-lg ml-2">▾</Text>
      </View>
      
      {/* Hidden picker that opens when TouchableOpacity is pressed */}
      <View style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }}>
        <RNPickerSelect
          ref={pickerRef}
          onValueChange={(v) => {
            if (typeof v === "string") onChange(v);
          }}
          value={value}
          items={pickerItems}
          disabled={disabled}
          placeholder={{ label: placeholderLabel, value: null }}
          useNativeAndroidPickerStyle={false}
          touchableWrapperProps={{
            style: { width: '100%', height: '100%' }
          }}
          style={{
            inputIOS: {
              width: '100%',
              height: '100%',
              color: "transparent",
              ...(inputStyleIOS ?? {}),
            },
            inputAndroid: {
              width: '100%',
              height: '100%',
              color: "transparent",
              ...(inputStyleAndroid ?? {}),
            },
            placeholder: { color: "transparent" },
            iconContainer: { display: 'none' },
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
