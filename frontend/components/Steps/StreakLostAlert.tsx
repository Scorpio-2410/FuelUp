import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

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
              {/* Broken Heart Icon - Enhanced Design */}
              <View className="items-center mb-6">
                <View 
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center border-4 border-slate-600"
                  style={{
                    shadowColor: "#1E293B",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 12,
                  }}>
                  <Text className="text-6xl" style={{ transform: [{ translateY: -2 }] }}>💔</Text>
                </View>
              </View>

              {/* Title with Glow Effect */}
              <Text className="text-white text-3xl font-black text-center mb-6 tracking-wide"
                    style={{
                      textShadowColor: '#64748B',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 10,
                    }}>
                Streak Lost
              </Text>

              {/* Previous Streak Count - More Dramatic */}
              {previousStreak > 0 && (
                <View className="items-center mb-6">
                  <View className="flex-row items-baseline">
                    <Text className="text-slate-400 text-7xl font-black mr-3"
                          style={{
                            textShadowColor: '#64748B',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 8,
                          }}>
                      {previousStreak}
                    </Text>
                    <Text className="text-slate-500 text-3xl font-bold">
                      Day{previousStreak !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Loss Badge */}
              <View className="bg-slate-800/30 rounded-2xl p-4 mb-6 border border-slate-600/40">
                <Text className="text-slate-200 text-xl text-center font-bold mb-2">
                  Your streak has ended
                </Text>
                <Text className="text-gray-400 text-center leading-6">
                  You missed yesterday's goal
                </Text>
              </View>
              
              {/* Motivational Message */}
              <View className="bg-blue-900/20 rounded-2xl p-4 mb-8 border border-blue-700/30">
                <Text className="text-blue-300 text-lg text-center font-semibold leading-relaxed">
                  Every champion has setbacks 💪
                </Text>
                <Text className="text-blue-200 text-base text-center font-bold mt-2">
                  Rise up and start fresh today! 🚀
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="bg-indigo-600 rounded-2xl py-4 px-6"
                style={{
                  shadowColor: "#4F46E5",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}>
                <Text className="text-white text-center font-bold text-lg">
                  I Understand 💪
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

