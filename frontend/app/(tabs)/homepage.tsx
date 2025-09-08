// app/(tabs)/homepage.tsx
import React, { useState, useCallback, useRef } from "react";
import { View, Text, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

import RealTimeCalendar from "../../components/RealTimeCalendar";
import RefreshScroll from "../../components/RefreshScroll";
import HomepageMotivationalQuotes from "../../components/HomepageMotivationalQuotes";
import HomepageGoalsMessage from "../../components/HomepageGoalsMessage";
import HomepageSteps from "../../components/HomepageSteps";
import HomepageCaloriesTracking from "../../components/HomepageCaloriesTracking";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";

const K_PROFILE = "fu_profile";
const API_BASE = "http://localhost:4000";

// Platform-safe storage helpers (cache only, *not* the auth token)
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};
const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};

type Profile = {
  username: string;
  avatarUri?: string | null;
};

// Map whatever the server returns to our light header shape
const mapFromServer = (u: any): Profile => ({
  username: u?.username ?? "",
  avatarUri: u?.avatar_uri ?? u?.avatarUri ?? null,
});

// Map a cached object (could be server or client shape)
const mapFromCache = (u: any): Profile => ({
  username: u?.username ?? "",
  avatarUri: u?.avatar_uri ?? u?.avatarUri ?? null,
});

export default function HomePageScreen() {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");

  const [profile, setProfile] = useState<Profile>({ username: "" });

  // Refs for triggering component refreshes
  const stepsRef = useRef<{ updateSteps: () => void }>(null);
  const quotesRef = useRef<{ updateQuote: () => void }>(null);
  const caloriesRef = useRef<{ updateCalories: () => void }>(null);
  const goalsRef = useRef<{ updateMessage: () => void }>(null);

  // Global refresh hook with custom homepage refresh logic
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "homepage",
    refreshDuration: 2000,
    onInternalRefresh: () => {
      stepsRef.current?.updateSteps();
      quotesRef.current?.updateQuote();
      caloriesRef.current?.updateCalories();
      goalsRef.current?.updateMessage();
      // also re-pull profile when user manually refreshes
      fetchFreshProfile();
    },
  });

  // —— Fetch fresh profile from API and update cache/UI ——
  const fetchFreshProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return; // 401, etc. -> keep whatever we have

      const json = await res.json();
      const fresh = mapFromServer(json?.user);
      setProfile(fresh);
      await setStorageItem(K_PROFILE, JSON.stringify(json.user)); // store raw server shape
    } catch {
      // silently ignore; we’ll keep showing cached values
    }
  }, []);

  // Load cached profile immediately when Home gains focus, then refresh from API
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        // 1) show cached right away
        const raw = await getStorageItem(K_PROFILE);
        if (alive && raw) {
          try {
            const cached = JSON.parse(raw);
            setProfile(mapFromCache(cached));
          } catch {
            // bad cache → ignore
          }
        }
        // 2) refresh from API (will update UI + cache)
        if (alive) await fetchFreshProfile();
      })();
      return () => {
        alive = false;
      };
    }, [fetchFreshProfile])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8 mt-4">
            <View className="flex-1 pr-4">
              <Text className="text-white text-2xl font-bold" numberOfLines={1}>
                {profile.username ? profile.username : "Welcome back!"}
              </Text>
            </View>
            <View
              className="w-20 h-20 rounded-full overflow-hidden items-center justify-center"
              style={{ backgroundColor: "#2a2a2a" }}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-neutral-400">🙂</Text>
              )}
            </View>
          </View>

          {/* Real-time Calendar Component */}
          <RealTimeCalendar className="mb-6" />

          {/* Motivational Quote Component */}
          <HomepageMotivationalQuotes ref={quotesRef} className="mb-6" />

          {/* Stats Cards Row */}
          <View className="flex-row gap-4 mb-6">
            <HomepageSteps ref={stepsRef} />
            <HomepageGoalsMessage ref={goalsRef} />
          </View>

          {/* Calorie Progress Component */}
          <HomepageCaloriesTracking ref={caloriesRef} className="mb-4" />
        </View>
      </RefreshScroll>
    </View>
  );
}
