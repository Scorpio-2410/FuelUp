// This file is the layout for the tabs in the app with swipe gestures.

import React from "react";
import { View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter, useSegments } from "expo-router";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

// built-in icon families and icons on the web https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

const tabs = ["homepage", "meal", "fitness", "user"];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Get current tab index
  const currentTabName = segments[segments.length - 1] || "homepage";
  const currentTabIndex = tabs.findIndex((tab) => tab === currentTabName);

  // Navigate to tab by index
  const navigateToTab = (index: number) => {
    if (index >= 0 && index < tabs.length && index !== currentTabIndex) {
      router.push(`/(tabs)/${tabs[index]}` as any);
    }
  };

  // Swipe gesture for navigation with improved sensitivity
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // More sensitive horizontal activation
    .failOffsetY([-20, 20]) // Larger vertical tolerance for scrolling
    .onEnd((event) => {
      "worklet";
      const threshold = 60; // Lower threshold for easier swiping
      const velocityThreshold = 300; // Lower velocity threshold for more responsive feel

      const shouldSwipeLeft =
        event.translationX < -threshold || event.velocityX < -velocityThreshold;
      const shouldSwipeRight =
        event.translationX > threshold || event.velocityX > velocityThreshold;

      if (shouldSwipeLeft && currentTabIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        runOnJS(navigateToTab)(currentTabIndex + 1);
      } else if (shouldSwipeRight && currentTabIndex > 0) {
        // Swipe right - go to previous tab
        runOnJS(navigateToTab)(currentTabIndex - 1);
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          <Tabs
            initialRouteName="homepage"
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
              tabBarInactiveTintColor: "#666",
              tabBarStyle: {
                backgroundColor: "#1a1a1a",
                borderTopColor: "#2a2a2a",
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 8,
                height: 88,
              },
              tabBarLabelStyle: {
                fontWeight: "600",
                fontSize: 12,
                marginTop: 4,
              },
              headerShown: useClientOnlyValue(false, true),
              animation: "shift",
            }}
          >
            <Tabs.Screen
              name="homepage"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => (
                  <TabBarIcon name="home" color={color} />
                ),
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="meal"
              options={{
                title: "Meal",
                tabBarIcon: ({ color }) => (
                  <TabBarIcon name="cutlery" color={color} />
                ),
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="fitness"
              options={{
                title: "Fitness",
                tabBarIcon: ({ color }) => (
                  <TabBarIcon name="heartbeat" color={color} />
                ),
                headerShown: false,
              }}
            />
            <Tabs.Screen
              name="user"
              options={{
                title: "User",
                tabBarIcon: ({ color }) => (
                  <TabBarIcon name="user" color={color} />
                ),
                headerShown: false,
              }}
            />
            {/** TargetQuestions removed from tab bar */}
          </Tabs>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
