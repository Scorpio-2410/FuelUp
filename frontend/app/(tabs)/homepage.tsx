// app/(tabs)/homepage.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

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

  // Profile state
  const [profile, setProfile] = useState<Profile>({ username: "" });

  // Refs for triggering component refreshes
  const stepsRef = useRef<{ updateSteps: () => void }>(null);
  const quotesRef = useRef<{ updateQuote: () => void }>(null);
  const caloriesRef = useRef<{ updateCalories: () => void }>(null);
  const goalsRef = useRef<{ updateMessage: () => void }>(null);

  // Always show something instantly (cache), then fetch fresh from backend
  const hydrateProfile = useCallback(async () => {
    let cached = await readProfileCache();
    if (cached) {
      setProfile({
        username: cached.username || "",
        avatarUri: cached.avatarUri || undefined,
      });
    }

    try {
      const { user } = await apiGetMe();
      if (user) {
        const fresh = {
          username: user.username || "",
          avatarUri: user.avatarUri || undefined,
        };
        setProfile(fresh);
        // keep cache warm for next time
        await writeProfileCache(user);
      }
    } catch {
      // network error → keep whatever is shown (cached or default)
    }
  }, []);

  // Global refresh hook with custom homepage refresh logic
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "homepage",
    refreshDuration: 2000,
    onInternalRefresh: async () => {
      await hydrateProfile(); // also re-fetch profile when user pulls to refresh
      stepsRef.current?.updateSteps();
      quotesRef.current?.updateQuote();
      caloriesRef.current?.updateCalories();
      goalsRef.current?.updateMessage();
    },
  });

  // Hydrate once on initial mount (instant cache paint)
  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  // And re-hydrate every time the tab/screen gains focus
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!alive) return;
        await hydrateProfile();
      })();
      return () => {
        alive = false;
      };
    }, [hydrateProfile])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
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
            <HomepageGoalsMessage ref={goalsRef} />
          </View>

          {/* Calorie Progress Component */}
          <HomepageCaloriesTracking ref={caloriesRef} className="mb-4" />
        </View>
      </RefreshScroll>
    </View>
  );
}
