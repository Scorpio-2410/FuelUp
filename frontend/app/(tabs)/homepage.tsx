// app/(tabs)/homepage.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import RealTimeCalendar from "../../components/RealTimeCalendar";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
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

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [stepCount, setStepCount] = useState(954);
  const [burnedCalories, setBurnedCalories] = useState(400);
  const [quote, setQuote] = useState("give up bro");
  const [goalMessage, setGoalMessage] = useState(
    "you r almost there! keep it up"
  );

  // Facebook-style pull-to-refresh values
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const spinRotation = useSharedValue(0);
  const lastVelocity = useSharedValue(0);
  const refreshThreshold = 130;

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

  // Spinning animation for refresh icon
  useEffect(() => {
    if (refreshing) {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      spinRotation.value = 0;
    }
  }, [refreshing]);

  // Facebook-style refresh function
  const triggerRefresh = useCallback(() => {
    if (refreshing) return;

    setRefreshing(true);

    setTimeout(() => {
      setStepCount(Math.floor(Math.random() * 2000) + 500);
      setBurnedCalories(Math.floor(Math.random() * 600) + 200);

      const quotes = [
        "give up bro",
        "you dont got this!",
        "keep crying",
        "stay negative!",
        "almost there! loser",
        "one more step! loser",
        "never give up! you are a loser!",
      ];
      const goals = [
        "you r almost there! keep it up loser",
        "great progress today! loser",
        "you're on fire! 🔥 loser",
        "crushing your goals! loser",
        "keep the momentum! loser",
        "excellent work! loser",
        "you're unstoppable! loser",
        "amazing effort! loser",
      ];

      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setGoalMessage(goals[Math.floor(Math.random() * goals.length)]);

      setRefreshing(false);
      pullDistance.value = withTiming(0, { duration: 300 });
    }, 2000);
  }, [refreshing]);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      lastVelocity.value = event.velocity ? event.velocity.y : 0;

      if (event.contentOffset.y <= 0) {
        const currentPull = Math.abs(event.contentOffset.y);
        pullDistance.value = currentPull;
        if (currentPull > refreshThreshold && !refreshing) {
          runOnJS(triggerRefresh)();
        }
      } else {
        pullDistance.value = 0;
      }
    },
  });



  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance.value,
      [0, refreshThreshold * 0.4, refreshThreshold],
      [0, 0.3, 1]
    );
    const translateY = interpolate(
      pullDistance.value,
      [0, refreshThreshold],
      [-50, 0]
    );
    const rotation = refreshing
      ? spinRotation.value
      : interpolate(pullDistance.value, [0, refreshThreshold], [0, 180]);
    return {
      opacity,
      transform: [{ translateY }, { rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      {/* Refresh indicator */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: insets.top + 20,
            left: "50%",
            marginLeft: -15,
            zIndex: 1000,
            width: 30,
            height: 30,
            backgroundColor: "#2a2a2a",
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
          },
          refreshIndicatorStyle,
        ]}>
        {refreshing ? (
          <FontAwesome name="spinner" size={16} color="#bbf246" />
        ) : (
          <FontAwesome name="refresh" size={16} color="#bbf246" />
        )}
      </Animated.View>

      <AnimatedScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={true}>
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

          {/* Quote of the day */}
          <View
            className="p-6 rounded-2xl mb-6 relative"
            style={{ backgroundColor: "#ffd93d", minHeight: 100 }}>
            <View className="pr-16 flex-1 justify-center">
              <Text className="text-black text-2xl font-bold leading-6">
                quote of the day: {quote}
              </Text>
            </View>
            <View className="absolute top-4 right-4 w-20 h-20 rounded-lg overflow-hidden">
              <Image
                source={require("../../assets/images/motivational.jpg")}
                className="w-full h-full"
                style={{ resizeMode: "cover" }}
              />
            </View>
          </View>

          {/* Stats Cards Row */}
          <View className="flex-row gap-4 mb-6">
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: "#c59fc4" }}>
              <Text className="text-black text-xl font-bold mb-1">Steps</Text>
              <Text className="text-black text-3xl font-bold">{stepCount}</Text>
              <Text className="text-black text-sm">Steps</Text>
            </View>
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: "#bbf246" }}>
              <Text className="text-black text-xl font-bold mb-1">
                Your Goal
              </Text>
              <Text className="text-black text-base font-medium">
                {goalMessage}
              </Text>
            </View>
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
      </AnimatedScrollView>
    </View>
  );
}
