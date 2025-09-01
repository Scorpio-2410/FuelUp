// app/(tabs)/homepage.tsx
import React, { useState, useCallback } from "react";
import { View, Text, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import RealTimeCalendar from "../../components/RealTimeCalendar";
import RefreshScroll from "../../components/RefreshScroll";
import HomepageMotivationalQuotes from "../../components/HomepageMotivationalQuotes";
import GoalMessage from "../../components/GoalMessage";

const K_PROFILE = "fu_profile";

// Platform-safe storage functions
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return localStorage.getItem(key);
  } else {
    // Use SecureStore for native platforms
    return await SecureStore.getItemAsync(key);
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    localStorage.setItem(key, value);
  } else {
    // Use SecureStore for native platforms
    await SecureStore.setItemAsync(key, value);
  }
};

type Profile = {
  username: string;
  avatarUri?: string;
};

// Homepage with fitness tracking, pull-to-refresh, and real-time calendar
// Clean separation of concerns with reusable components
export default function HomePageScreen() {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");

  // Profile state
  const [profile, setProfile] = useState<Profile>({ username: "" });

  // App state
  const [refreshing, setRefreshing] = useState(false);
  const [stepCount, setStepCount] = useState(954);
  const [burnedCalories, setBurnedCalories] = useState(400);

  // Load profile whenever Home is focused
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const raw = await getStorageItem(K_PROFILE);
        if (alive && raw) {
          const parsed = JSON.parse(raw);
          setProfile({
            username: parsed?.username || "",
            avatarUri: parsed?.avatarUri,
          });
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  // Facebook-style refresh function
  const triggerRefresh = useCallback(() => {
    if (refreshing) return;

    setRefreshing(true);

    setTimeout(() => {
      setStepCount(Math.floor(Math.random() * 2000) + 500);
      setBurnedCalories(Math.floor(Math.random() * 600) + 200);
      setRefreshing(false);
    }, 2000);
  }, [refreshing]);

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
        <RefreshScroll
        refreshing={refreshing}
        onRefresh={triggerRefresh}>
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8 mt-4">
            <View className="flex-1 pr-4">
              <Text className="text-white text-2xl font-bold" numberOfLines={1}>
                {profile.username ? `${profile.username}` : "Welcome back!"}
              </Text>
            </View>
            <View
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{ backgroundColor: "#2a2a2a" }}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  className="w-full h-full"
                />
              ) : null}
            </View>
          </View>

          {/* Real-time Calendar Component */}
          <RealTimeCalendar className="mb-6" />

          {/* Motivational Quote Component */}
          <HomepageMotivationalQuotes className="mb-6" />

          {/* Stats Cards Row */}
          <View className="flex-row gap-4 mb-6">
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: "#c59fc4" }}>
              <Text className="text-black text-xl font-bold mb-1">Steps</Text>
              <Text className="text-black text-3xl font-bold">{stepCount}</Text>
              <Text className="text-black text-sm">Steps</Text>
            </View>
            <GoalMessage />
          </View>

          {/* Calorie Progress */}
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: "#2a2a2a",
              marginBottom: insets.bottom || 16,
            }}>
            <View className="flex-row items-center">
              <View className="flex-1 pr-4">
                <View className="mb-4">
                  <View className="flex-row items-center mb-1">
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: "#bbf246" }}
                    />
                    <Text className="text-white text-2xl font-semibold">
                      1000 Kcal
                    </Text>
                  </View>
                  <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                    Target
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center mb-1">
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: "#ff6b35" }}
                    />
                    <Text className="text-white text-2xl font-semibold">
                      {burnedCalories} Kcal
                    </Text>
                  </View>
                  <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                    Burned
                  </Text>
                </View>
              </View>
              <View className="relative items-center justify-center">
                <Svg width="160" height="160">
                  <Circle
                    cx="80"
                    cy="80"
                    r="62"
                    stroke="#bbf246"
                    strokeWidth="35"
                    fill="transparent"
                  />
                  <Circle
                    cx="80"
                    cy="80"
                    r="62"
                    stroke="#ff6b35"
                    strokeWidth="35"
                    fill="transparent"
                    strokeDasharray="156 233"
                    strokeLinecap="round"
                    transform="rotate(-80 80 80)"
                  />
                </Svg>
              </View>
            </View>
          </View>
        </View>
      </RefreshScroll>
    </View>
  );
}
