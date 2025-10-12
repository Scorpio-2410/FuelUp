import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
};

export default function StreakCongratulationsAlert({
  visible,
  streakCount,
  onClose,
}: Props) {
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
          <Pressable onPress={(e) => e.stopPropagation()}>
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
              {/* Fire Icon with Gradient Glow */}
              <View className="items-center mb-4">
                <LinearGradient
                  colors={['#FF6B35', '#FF8E53', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    shadowColor: "#FF6B35",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.8,
                    shadowRadius: 16,
                    elevation: 10,
                  }}>
                  <Text className="text-6xl">🔥</Text>
                </LinearGradient>
              </View>

              {/* Title */}
              <Text className="text-white text-2xl font-black text-center mb-2">
                Congratulations!
              </Text>

              {/* Streak Count */}
              <View className="flex-row items-center justify-center mb-3">
                <Text className="text-orange-400 text-5xl font-black mr-2">
                  {streakCount}
                </Text>
                <Text className="text-orange-400 text-2xl font-bold">
                  Day{streakCount !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Message */}
              <Text className="text-gray-300 text-base text-center mb-2 leading-6">
                {streakCount === 1 
                  ? "You've completed your daily goal and unlocked your streak! 🎯"
                  : "Amazing! You've kept your streak going! 💪"
                }
              </Text>
              
              <Text className="text-orange-400 text-sm text-center mb-6 font-bold">
                Keep it up to maintain your fire! 🔥
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="rounded-2xl py-4 px-6 overflow-hidden"
                style={{
                  shadowColor: "#FF6B35",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 8,
                }}>
                <LinearGradient
                  colors={['#FF6B35', '#FF8E53', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                <Text className="text-white text-center font-bold text-lg relative z-10">
                  Awesome! 🚀
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

