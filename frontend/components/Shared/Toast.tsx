// frontend/components/Shared/Toast.tsx
import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type ToastProps = {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onHide?: () => void;
};

export default function Toast({
  visible,
  message,
  type = "success",
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      if (onHide) {
        runOnJS(onHide)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colors = {
    success: {
      bg: "#22c55e",
      icon: "checkmark-circle" as const,
      iconColor: "#fff",
    },
    error: {
      bg: "#ef4444",
      icon: "close-circle" as const,
      iconColor: "#fff",
    },
    info: {
      bg: "#3b82f6",
      icon: "information-circle" as const,
      iconColor: "#fff",
    },
  };

  const config = colors[type];

  if (!visible && translateY.value === -100) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 60,
          left: 20,
          right: 20,
          zIndex: 9999,
          backgroundColor: config.bg,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <Text
        style={{
          flex: 1,
          color: "#fff",
          fontSize: 15,
          fontWeight: "600",
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
