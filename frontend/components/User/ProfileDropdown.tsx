import React, { useState } from "react";
import { View, Text, ViewStyle, TouchableOpacity, Modal, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

type DropdownItem = { label: string; value: string };
type Props = {
  value: string;
  items: readonly DropdownItem[];
  onChange: (v: string) => void;
  placeholderLabel: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
};

export default function ProfileDropdown({
  value,
  items,
  onChange,
  placeholderLabel,
  disabled = false,
  containerStyle,
  testID,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = items.find(i => i.value === value)?.label || placeholderLabel;
  const isPlaceholder = !value || !items.find(i => i.value === value);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        testID={testID}
        onPress={() => !disabled && setIsOpen(true)}
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
      </TouchableOpacity>

      {/* Custom Modal Dropdown */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable 
          className="flex-1 bg-black/70"
          onPress={() => setIsOpen(false)}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1 justify-end">
            <View>
              <Animated.View 
                entering={SlideInDown.duration(300).springify()}
                exiting={SlideOutDown.duration(200)}
                className="bg-gray-900 rounded-t-3xl"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 20,
                }}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-700">
                  <Text className="text-white text-xl font-bold">
                    Select Option
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
                    activeOpacity={0.7}>
                    <Text className="text-white text-xl">✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Options List */}
                <ScrollView 
                  className="px-4 py-3" 
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 400 }}>
                  {items.map((item) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => handleSelect(item.value)}
                        activeOpacity={0.7}
                        className={`flex-row items-center justify-between px-5 py-4 rounded-2xl mb-3 ${
                          isSelected 
                            ? 'bg-emerald-500 border-2 border-emerald-400' 
                            : 'bg-gray-800 border border-gray-700'
                        }`}
                        style={{
                          shadowColor: isSelected ? "#10B981" : "transparent",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.5 : 0,
                          shadowRadius: 8,
                          elevation: isSelected ? 6 : 0,
                        }}>
                        <Text 
                          className={`text-xl font-bold ${
                            isSelected ? 'text-white' : 'text-gray-300'
                          }`}>
                          {item.label}
                        </Text>
                        {isSelected && (
                          <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
                            <Text className="text-emerald-500 text-base font-black">✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <View className="h-2" />
                </ScrollView>
              </Animated.View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
