import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

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
              {/* Fire Icon - Enhanced Design */}
              <View className="items-center mb-6">
                <View 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 items-center justify-center border-4 border-orange-300"
                  style={{
                    shadowColor: "#F97316",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 12,
                  }}>
                  <Text className="text-6xl">🔥</Text>
                </View>
              </View>

              {/* Title with Glow Effect */}
              <Text className="text-white text-3xl font-black text-center mb-6 tracking-wide"
                    style={{
                      textShadowColor: '#F97316',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 10,
                    }}>
                Congratulations!
              </Text>

              {/* Streak Count - More Dramatic */}
              <View className="items-center mb-6">
                <View className="flex-row items-baseline">
                  <Text className="text-orange-400 text-7xl font-black mr-3"
                        style={{
                          textShadowColor: '#F97316',
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 8,
                        }}>
                    {streakCount}
                  </Text>
                  <Text className="text-orange-300 text-3xl font-bold">
                    Day{streakCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Achievement Badge */}
              <View className="bg-orange-500/20 rounded-2xl p-4 mb-6 border border-orange-400/30">
                <Text className="text-orange-200 text-xl text-center font-bold mb-2">
                  {streakCount === 1 ? "🎯 Goal Achieved!" : "🔥 Streak Maintained!"}
                </Text>
                <Text className="text-gray-200 text-center leading-6">
                  {streakCount === 1 
                    ? "You've unlocked your streak!"
                    : "You're on fire! Keep it going!"
                  }
                </Text>
              </View>
              
              {/* Motivational Message */}
              <Text className="text-orange-300 text-lg text-center font-semibold mb-8 leading-relaxed">
                Keep moving to maintain your streak! 🚀
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="bg-orange-500 rounded-2xl py-4 px-6"
                style={{
                  shadowColor: "#F97316",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}>
                <Text className="text-white text-center font-bold text-lg">
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

