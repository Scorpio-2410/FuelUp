import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  visible: boolean;
  previousStreak: number;
  onClose: () => void;
};

export default function StreakLostAlert({
  visible,
  previousStreak,
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
              {/* Broken Fire Icon with Gray Gradient */}
              <View className="items-center mb-4">
                <LinearGradient
                  colors={['#6B7280', '#9CA3AF', '#D1D5DB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    shadowColor: "#6B7280",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                    elevation: 10,
                  }}>
                  <Text className="text-6xl">💔</Text>
                </LinearGradient>
              </View>

              {/* Title */}
              <Text className="text-white text-2xl font-black text-center mb-2">
                Streak Lost
              </Text>

              {/* Previous Streak Count */}
              {previousStreak > 0 && (
                <View className="flex-row items-center justify-center mb-3">
                  <Text className="text-gray-400 text-4xl font-black mr-2">
                    {previousStreak}
                  </Text>
                  <Text className="text-gray-400 text-xl font-bold">
                    Day{previousStreak !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Message */}
              <Text className="text-gray-300 text-base text-center mb-2 leading-6">
                Your {previousStreak} day{previousStreak !== 1 ? 's' : ''} streak is lost 💔
              </Text>
              
              <Text className="text-blue-400 text-sm text-center mb-6 font-bold">
                Every champion has setbacks. Rise up and start fresh today! 💪
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="rounded-2xl py-4 px-6 overflow-hidden"
                style={{
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 8,
                }}>
                <LinearGradient
                  colors={['#3B82F6', '#60A5FA', '#93C5FD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                <Text className="text-white text-center font-bold text-lg relative z-10">
                  Start Fresh Today! 🚀
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

