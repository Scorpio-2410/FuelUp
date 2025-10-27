import React, { useState } from "react";
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
  /** Field variant for different styling */
  variant?: 'default' | 'email' | 'password';
};

export default function ProfileField({
  label,
  textInputProps,
  inputClassName,
  rightAccessory,
  containerStyle,
  children,
  variant = 'default',
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  // Get field-specific styling based on variant and focus state
  const getFieldStyles = () => {
    const baseContainer = isFocused 
      ? "bg-gray-900/50 rounded-xl border border-blue-500"
      : "bg-gray-900/50 rounded-xl border border-gray-800/50";
    
    return {
      container: baseContainer,
      input: "bg-transparent text-white rounded-xl px-4 py-4",
      label: "text-gray-200 mb-3 font-semibold text-sm tracking-wide",
      shadow: {
        shadowColor: isFocused ? "#3B82F6" : "#000",
        shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
        shadowOpacity: isFocused ? 0.2 : 0.1,
        shadowRadius: isFocused ? 4 : 2,
        elevation: isFocused ? 2 : 1,
      }
    };
  };

  const fieldStyles = getFieldStyles();

  return (
    <View className="mb-5" style={containerStyle}>
      {textInputProps ? (
        // TextInput mode with clean label above field
        <View>
          {/* Label above field */}
          <Text className="text-gray-200 mb-3 font-semibold text-sm tracking-wide">
            {label}
          </Text>
          
          {/* Clean container with solid background */}
          <View className={fieldStyles.container} style={fieldStyles.shadow}>
            <TextInput
              {...textInputProps}
              className={
                inputClassName
                  ? `${fieldStyles.input} ${inputClassName}`
                  : fieldStyles.input
              }
              placeholder={textInputProps.placeholder}
              placeholderTextColor={
                textInputProps.placeholderTextColor ?? "#9CA3AF"
              }
              style={{
                fontSize: 16,
                fontWeight: "400",
                paddingTop: 16,
                paddingBottom: 16,
                minHeight: 60,
              }}
              onFocus={(e) => {
                setIsFocused(true);
                textInputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                textInputProps.onBlur?.(e);
              }}
              onChangeText={textInputProps.onChangeText}
            />
            {rightAccessory && (
              <View className="absolute right-3 top-0 bottom-0 justify-center">
                {rightAccessory}
              </View>
            )}
          </View>
        </View>
      ) : (
        // Custom content mode
        <View className={fieldStyles.container} style={fieldStyles.shadow}>
          <View className="flex-1">{children}</View>
          {rightAccessory && (
            <View className="absolute right-3 top-0 bottom-0 justify-center">
              {rightAccessory}
            </View>
          )}
        </View>
      )}
    </View>
  );
}