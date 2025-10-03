import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from "react-native";

type Props = {
  label: string;
  /** If provided, ProfileField renders a styled TextInput */
  textInputProps?: TextInputProps;
  /** Extra className for the TextInput */
  inputClassName?: string;
  /** Optional right-side accessory (e.g., a unit dropdown) */
  rightAccessory?: React.ReactNode;
  /** Container style override */
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function ProfileField({
  label,
  textInputProps,
  inputClassName,
  rightAccessory,
  containerStyle,
  children,
}: Props) {
  const baseInputClass =
    "flex-1 bg-gray-900/50 text-white rounded-xl px-4 py-3.5 border border-gray-800/50";

  return (
    <View className="mb-5" style={containerStyle}>
      <Text className="text-gray-300 mb-2.5 text-sm font-semibold tracking-wide">
        {label}
      </Text>

      {textInputProps ? (
        // TextInput mode
        <View className="flex-row gap-3 items-stretch">
          <TextInput
            {...textInputProps}
            className={
              inputClassName
                ? `${baseInputClass} ${inputClassName}`
                : baseInputClass
            }
            placeholderTextColor={
              textInputProps.placeholderTextColor ?? "#6B7280"
            }
            style={{
              fontSize: 16,
              fontWeight: "500",
            }}
          />
          {rightAccessory ? <View>{rightAccessory}</View> : null}
        </View>
      ) : (
        // Custom content mode (children) — now also supports rightAccessory
        <View className="flex-row gap-3 items-stretch">
          <View className="flex-1">{children}</View>
          {rightAccessory ? <View>{rightAccessory}</View> : null}
        </View>
      )}
    </View>
  );
}
