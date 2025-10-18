import React, { useState, useCallback, useRef } from "react";
import { View, Text, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

import RealTimeCalendar from "../../components/Homepage/RealTimeCalendar";
import RefreshScroll from "../../components/RefreshScroll";
import HomepageMotivationalQuotes from "../../components/Homepage/HomepageMotivationalQuotes";
import HomepageGoalsMessage from "../../components/Homepage/HomepageMealRecommendation";
import HomepageSteps from "../../components/Homepage/HomepageSteps";
import HomepageCaloriesTracking from "../../components/Homepage/HomepageCaloriesTracking";
import DailyCalorieSummary from "../../components/Homepage/DailyCalorieSummary";
import FitnessActivityTracker from "../../components/Homepage/FitnessActivityTracker";
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
  const [stepsWidgetHeight, setStepsWidgetHeight] = useState(0);

  // Refs to drive pull-to-refresh updates
  const stepsRef = useRef<{ updateSteps: () => void }>(null);
  const quotesRef = useRef<{ updateQuote: () => void }>(null);
  const caloriesRef = useRef<{ updateCalories: () => void }>(null);
  const dailyCaloriesRef = useRef<{ refresh: () => void }>(null);
  const fitnessActivityRef = useRef<{ refresh: () => void }>(null);
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
      dailyCaloriesRef.current?.refresh();
      fitnessActivityRef.current?.refresh();
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

          {/* Steps and Background GIFs section */}
          <View style={{ marginBottom: 32, position: "relative" }}>
            {/* Steps Widget - 45% (Foreground) */}
            <View
              style={{ width: "45%", zIndex: 1 }}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setStepsWidgetHeight(height);
              }}
            >
              <HomepageSteps ref={stepsRef} />
            </View>

            {/* Background GIF Section - 55% */}
            {stepsWidgetHeight > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: "45%",
                  width: "55%",
                  height: stepsWidgetHeight,
                  flexDirection: "row",
                  gap: 3,
                  zIndex: 0,
                  paddingLeft: 4,
                }}
              >
                <View
                  style={{ flex: 1.1, borderRadius: 16, overflow: "hidden" }}
                >
                  <Image
                    source={require("../../assets/images/Cowboy-Bebop-Love.gif")}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
                <View
                  style={{ flex: 0.8, borderRadius: 16, overflow: "hidden" }}
                >
                  <Image
                    source={require("../../assets/images/Art-Running.gif")}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Meal Recommendation */}
          <HomepageGoalsMessage ref={goalsRef} className="mb-8" />

          {/* Daily Calorie Summary */}
          <DailyCalorieSummary ref={dailyCaloriesRef} className="mb-6" />

          {/* Fitness Activity Tracker */}
          <FitnessActivityTracker ref={fitnessActivityRef} className="mb-6" />

          {/* Legacy Calories (keeping for now) */}
          <HomepageCaloriesTracking ref={caloriesRef} className="mb-6" />
        </View>
      </RefreshScroll>
    </View>
  );
}
