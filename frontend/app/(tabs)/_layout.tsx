// Tab layout configuration with clean separation of concerns
// Uses SwipeNavigate component for gesture handling

import React from "react";
import { View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import SwipeNavigate from "../../components/SwipeNavigate";
import CustomTabBar from "../../components/CustomTabBar";
import DynamicBackground from "../../components/Theme/DynamicTheme";

// built-in icon families and icons on the web https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

const tabs = ["homepage", "meal", "fitness", "user", "theme"];

const tabConfigs = [
  {
    name: "homepage",
    label: "Home",
    icon: "home-outline" as keyof typeof Ionicons.glyphMap,
    activeIcon: "home" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "meal",
    label: "Meal",
    icon: "restaurant-outline" as keyof typeof Ionicons.glyphMap,
    activeIcon: "restaurant" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "fitness",
    label: "Fitness",
    icon: "fitness-outline" as keyof typeof Ionicons.glyphMap,
    activeIcon: "fitness" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "user",
    label: "Profile",
    icon: "person-outline" as keyof typeof Ionicons.glyphMap,
    activeIcon: "person" as keyof typeof Ionicons.glyphMap,
  },
  {
    name: "theme",
    label: "Theme",
    icon: "color-palette-outline" as keyof typeof Ionicons.glyphMap,
    activeIcon: "color-palette" as keyof typeof Ionicons.glyphMap,
  },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Get current tab index
  const currentTabName = segments[segments.length - 1] || "homepage";
  const currentTabIndex = tabs.findIndex((tab) => tab === currentTabName);

  // Navigate to tab by index - simplified callback for swipe component
  const handleTabChange = (index: number) => {
    router.push(`/(tabs)/${tabs[index]}` as any);
  };

  // Navigate to tab by name - for custom tab bar
  const handleTabPress = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  return (
    <DynamicBackground>
      <SwipeNavigate
        currentTabIndex={currentTabIndex}
        totalTabs={tabs.length}
        onTabChange={handleTabChange}
        swipeThreshold={60}
        velocityThreshold={300}
        horizontalSensitivity={15}
        verticalTolerance={20}
      >
        <Tabs
          initialRouteName="homepage"
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            tabBarInactiveTintColor: "#666",
            tabBarStyle: {
              display: "none", // Hide default tab bar
            },
            headerShown: useClientOnlyValue(false, true),
            animation: "shift",
            sceneStyle: {
              backgroundColor: "transparent", // Make tabs transparent to show theme
            },
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
          <Tabs.Screen
            name="theme"
            options={{
              title: "Theme",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="paint-brush" color={color} />
              ),
              headerShown: false,
            }}
          />
        </Tabs>
      </SwipeNavigate>

      {/* Custom Tab Bar */}
      <CustomTabBar
        activeTab={currentTabName}
        onTabPress={handleTabPress}
        tabs={tabConfigs}
      />
    </DynamicBackground>
  );
}
