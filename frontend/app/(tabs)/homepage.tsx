// app/(tabs)/homepage.tsx
import React, { useState, useCallback, useRef } from "react";
import { View, Text, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import RealTimeCalendar from "../../components/RealTimeCalendar";
import RefreshScroll from "../../components/RefreshScroll";
import HomepageMotivationalQuotes from "../../components/HomepageMotivationalQuotes";
import HomepageGoalsMessage from "../../components/HomepageGoalsMessage";
import HomepageSteps from "../../components/HomepageSteps";
import HomepageCaloriesTracking from "../../components/HomepageCaloriesTracking";

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
  
  // Refs for triggering component refreshes
  const stepsRef = useRef<{ updateSteps: () => void }>(null);
  const quotesRef = useRef<{ updateQuote: () => void }>(null);
  const caloriesRef = useRef<{ updateCalories: () => void }>(null);

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
      // Trigger all component refreshes
      stepsRef.current?.updateSteps();
      quotesRef.current?.updateQuote();
      caloriesRef.current?.updateCalories();
      
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
          <HomepageMotivationalQuotes ref={quotesRef} className="mb-6" />

          {/* Stats Cards Row */}
          <View className="flex-row gap-4 mb-6">
            <HomepageSteps ref={stepsRef} />
            <HomepageGoalsMessage />
          </View>

          {/* Calorie Progress Component */}
          <HomepageCaloriesTracking ref={caloriesRef} className="mb-4" />
        </View>
      </RefreshScroll>
    </View>
  );
}
