// Tab layout configuration with clean separation of concerns
// Uses SwipeNavigate component for gesture handling

import React from "react";
import { View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter, useSegments } from "expo-router";

import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import SwipeNavigate from "../../components/SwipeNavigate";

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

  // Navigate to tab by index - simplified callback for swipe component
  const handleTabChange = (index: number) => {
    router.push(`/(tabs)/${tabs[index]}` as any);
  };

  return (
    <SwipeNavigate
      children={undefined}
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
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
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
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
    </SwipeNavigate>
  );
}
