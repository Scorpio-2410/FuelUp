import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

type AlertType = "success" | "error" | "warning";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  // Optional confirmation mode props
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
};

export default function CustomAlert({
  visible,
  title,
  message,
  type = "success",
  onClose,
  showCancel = false,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
}: Props) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "✓";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "bg-emerald-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  const getIconShadow = () => {
    switch (type) {
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Pressable 
        className="flex-1 bg-black/70 items-center justify-center"
        onPress={onClose}>
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="flex-1 items-center justify-center px-8">
          <View>
            <Animated.View
              entering={ZoomIn.duration(300).springify()}
              exiting={ZoomOut.duration(200)}
              className="bg-gray-900 rounded-3xl p-6 w-80"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 20,
              }}>
              {/* Icon */}
              <View className="items-center mb-4">
                <View 
                  className={`w-16 h-16 rounded-full ${getIconColor()} items-center justify-center`}
                  style={{
                    shadowColor: getIconShadow(),
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 8,
                  }}>
                  <Text className="text-white text-4xl font-black">{getIcon()}</Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-white text-2xl font-black text-center mb-3">
                {title}
              </Text>

              {/* Message */}
              <Text className="text-gray-300 text-base text-center mb-6 leading-6">
                {message}
              </Text>

              {/* Action Buttons */}
              {showCancel ? (
                // Two-button layout for confirmation
                <View className="flex-row gap-3">
                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.8}
                    className="flex-1 bg-gray-700 rounded-2xl py-4 px-4"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}>
                    <Text className="text-white text-center font-bold text-base">
                      {cancelText}
                    </Text>
                  </TouchableOpacity>

                  {/* Confirm Button */}
                  <TouchableOpacity
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    className={`flex-1 ${getIconColor()} rounded-2xl py-4 px-4`}
                    style={{
                      shadowColor: getIconShadow(),
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 6,
                    }}>
                    <Text className="text-white text-center font-bold text-base">
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Single OK button
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  className={`${getIconColor()} rounded-2xl py-4 px-6`}
                  style={{
                    shadowColor: getIconShadow(),
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}>
                  <Text className="text-white text-center font-bold text-lg">
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

