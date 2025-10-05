// Custom stylistic tab bar with modern animations and design
import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

interface CustomTabBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
  tabs: TabConfig[];
}

export default function CustomTabBar({
  activeTab,
  onTabPress,
  tabs,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = tabs.findIndex((tab) => tab.name === activeTab);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: "transparent",
      }}
    >
      {/* Glassmorphism background container with blur */}
      <BlurView
        intensity={90}
        tint="dark"
        style={{
          marginHorizontal: 16,
          marginBottom: 6,
          borderRadius: 80,
          borderWidth: 1,
          borderColor: "rgba(116, 113, 113, 0.89)",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 18,
          elevation: 5,
        }}
      >
        {/* Overlay tint for color */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(36, 42, 42, 0.66)",
          }}
        />

        {/* Tab buttons container */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 12,
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.name;

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => onTabPress(tab.name)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                }}
              >
                {/* Icon with glow effect when active */}
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    padding: isActive ? 8 : 0,
                    borderRadius: 16,
                    backgroundColor: isActive
                      ? "rgba(74, 222, 128, 0.12)"
                      : "transparent",
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive
                      ? "rgba(74, 222, 128, 0.35)"
                      : "transparent",
                  }}
                >
                  {/* Icon */}
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={24}
                    color={isActive ? "#86efac" : "#9ca3af"}
                    style={{
                      marginBottom: 4,
                    }}
                  />
                </View>

                {/* Active indicator dot */}
                {isActive && (
                  <View
                    style={{
                      marginTop: 4,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#22c55e",
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
