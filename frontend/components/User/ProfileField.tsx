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
    "flex-1 bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800";

  return (
    <View className="mb-4" style={containerStyle}>
      <Text className="text-neutral-300 mb-2">{label}</Text>

      {textInputProps ? (
        // TextInput mode
        <View className="flex-row gap-4 items-stretch">
          <TextInput
            {...textInputProps}
            className={
              inputClassName
                ? `${baseInputClass} ${inputClassName}`
                : baseInputClass
            }
            placeholderTextColor={
              textInputProps.placeholderTextColor ?? "#9CA3AF"
            }
          />
          {rightAccessory ? <View>{rightAccessory}</View> : null}
        </View>
      ) : (
        // Custom content mode (children) — now also supports rightAccessory
        <View className="flex-row gap-4 items-stretch">
          <View className="flex-1">{children}</View>
          {rightAccessory ? <View>{rightAccessory}</View> : null}
        </View>
      )}
    </View>
  );
}
