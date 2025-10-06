import React, { useState, useCallback, useRef } from "react";
import { View, Text, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import DynamicBackground from "../../components/Theme/DynamicBackground";
import { useTheme } from "../../contexts/ThemeContext";

import RealTimeCalendar from "../../components/Homepage/RealTimeCalendar";
import RefreshScroll from "../../components/RefreshScroll";
import HomepageMotivationalQuotes from "../../components/Homepage/HomepageMotivationalQuotes";
import HomepageGoalsMessage from "../../components/Homepage/HomepageGoalsMessage";
import HomepageSteps from "../../components/Homepage/HomepageSteps";
import HomepageCaloriesTracking from "../../components/Homepage/HomepageCaloriesTracking";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";

import {
  apiGetMe,
  readProfileCache,
  writeProfileCache,
} from "../../constants/api";

type Profile = {
  username: string;
  avatarUri?: string;
};

export default function HomePageScreen() {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile>({ username: "" });

  // Refs to drive pull-to-refresh updates
  const stepsRef = useRef<{ updateSteps: () => void }>(null);
  const quotesRef = useRef<{ updateQuote: () => void }>(null);
  const caloriesRef = useRef<{ updateCalories: () => void }>(null);
  const goalsRef = useRef<{ updateMessage: () => void }>(null);

  const fetchHeaderProfile = useCallback(async () => {
    try {
      const { user } = await apiGetMe();
      if (user) {
        const u = {
          username: user.username ?? "",
          avatarUri: user.avatarUri ?? undefined,
        };
        setProfile(u);
        await writeProfileCache(user);
        return;
      }
    } catch {
      // fall back to cache if offline/unauth
      const cached = await readProfileCache();
      if (cached) {
        setProfile({
          username: cached.username ?? "",
          avatarUri: cached.avatarUri ?? undefined,
        });
      }
    }
  }, []);

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "homepage",
    refreshDuration: 1200,
    onInternalRefresh: () => {
      stepsRef.current?.updateSteps();
      quotesRef.current?.updateQuote();
      caloriesRef.current?.updateCalories();
      goalsRef.current?.updateMessage();
      fetchHeaderProfile();
    },
  });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!alive) return;
        await fetchHeaderProfile();
      })();
      return () => {
        alive = false;
      };
    }, [fetchHeaderProfile])
  );

  return (
          <DynamicBackground
            theme={theme}
            intensity="medium">
      <View style={{ flex: 1, paddingBottom: 80 }}>
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
                className="w-20 h-20 rounded-full overflow-hidden"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                {profile.avatarUri ? (
                  <Image
                    source={{ uri: profile.avatarUri }}
                    className="w-full h-full"
                  />
                ) : null}
              </View>
            </View>

          {/* Calendar */}
          <RealTimeCalendar className="mb-12" />

          {/* Quote */}
          <HomepageMotivationalQuotes ref={quotesRef} className="mb-8" />

          {/* Stats row */}
          <View className="flex-row gap-6 mb-8">
            <HomepageSteps ref={stepsRef} />
            <HomepageGoalsMessage ref={goalsRef} />
          </View>

          {/* Calories */}
          <HomepageCaloriesTracking ref={caloriesRef} className="mb-6" />
          </View>
        </RefreshScroll>
      </View>
    </DynamicBackground>
  );
}
