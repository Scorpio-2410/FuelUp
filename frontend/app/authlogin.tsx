// app/authlogin.tsx
import React, { useState } from "react";
import { View, Text, Alert, Pressable, Image, TextInput } from "react-native";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import ProfileField from "../components/User/ProfileField";
import { apiLogin, storeToken } from "../constants/api";

type Stage = "landing" | "form";

// Color options for sign-in buttons
const SIGNIN_COLORS = {
  blue: { 
    bg: '#3B82F6', 
    shadow: '#3B82F6',
    className: 'bg-blue-500'
  },
  orange: { 
    bg: '#F97316', 
    shadow: '#F97316',
    className: 'bg-orange-500'
  },
  purple: { 
    bg: '#8B5CF6', 
    shadow: '#8B5CF6',
    className: 'bg-purple-500'
  },
};

// Change this to test different colors: 'blue' | 'orange' | 'purple'
const SELECTED_SIGNIN_COLOR: 'blue' | 'orange' | 'purple' = 'blue';

export default function AuthLogin() {
  const [stage, setStage] = useState<Stage>("landing");
  
  // Get the selected color
  const signinColor = SIGNIN_COLORS[SELECTED_SIGNIN_COLOR];

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  // Create swipe gesture that goes back to landing
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([10, Infinity]) // Only right swipes
    .onEnd((event) => {
      'worklet';
      if (event.translationX > 100 && event.velocityX > 300) {
        setStage('landing');
      }
    });

  const onLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing info", "Please enter email/username and password.");
      return;
    }
    try {
      setLoading(true);
      // Add haptic feedback for login attempt
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { token } = await apiLogin({
        identifier: identifier.trim(),
        password,
      });
      await storeToken(token);
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/targetquestions");
    } catch (e: any) {
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#1C1C1C', '#2A2A2A', '#1a1a1a']}
        style={{ flex: 1 }}
      >
      <SafeAreaView
        style={{ paddingTop: insets.top }}
        className="flex-1">
        {stage === "landing" ? (
          <View className="flex-1 items-center justify-center px-8">
            {/* Logo with animation */}
            <Animated.View
              entering={FadeIn.duration(800)}
              className="items-center mb-8"
            >
              <Image
                source={require("../assets/images/FuelUpIcon.png")}
                resizeMode="contain"
                className="w-40 h-40 mb-6 rounded-2xl"
                style={{
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                }}
              />
              {/* Enhanced tagline */}
              <Text className="text-gray-300 text-lg font-semibold text-center leading-6">
                Build healthy habits. Track progress. Fuel your goals.
              </Text>
            </Animated.View>

            {/* Enhanced buttons with glassmorphism */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              className="w-full gap-4"
            >
              {/* Primary "Get Started" button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/authsignup");
                }}
                className="w-full rounded-2xl py-4 bg-emerald-500"
                style={{
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white text-center font-bold text-base">
                  Get Started
                </Text>
              </Pressable>

              {/* Secondary "I have an account" button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStage("form");
                }}
                className="w-full rounded-2xl py-4"
                style={{
                  backgroundColor: signinColor.bg,
                  shadowColor: signinColor.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white text-center font-semibold text-base">
                  I already have an account
                </Text>
              </Pressable>
            </Animated.View>
          </View>
      ) : (
        <GestureDetector gesture={swipeGesture}>
          <Animated.View 
            entering={ZoomIn.duration(400).springify()}
            className="flex-1 px-5 pt-4"
          >
          {/* Enhanced back button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStage("landing");
            }}
            className="absolute left-5 w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            style={{ 
              top: 4, 
              zIndex: 50,
              shadowColor: "#ffffff",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <ArrowLeft size={20} color="white" />
          </Pressable>

          {/* Enhanced header section */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)}
            className="items-center mt-8 mb-8"
          >
            <Image
              source={require("../assets/images/FuelUpIcon.png")}
              resizeMode="contain"
              className="w-16 h-16 mb-4 rounded-xl"
              style={{
                shadowColor: "#10B981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            />
            <Text className="text-white text-3xl font-black">Welcome back</Text>
          </Animated.View>

          {/* Glassmorphic form container */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="bg-neutral-900/50 rounded-3xl p-6"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >

            <ProfileField
              label="Email or Username"
              textInputProps={{
                value: identifier,
                onChangeText: setIdentifier,
                autoCapitalize: "none",
                placeholder: "you@example.com or yourname",
              }}
            />

            {/* Enhanced password field */}
            <View className="mb-6">
              <Text className="text-gray-300 mb-3 font-medium">Password</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!pwVisible}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="password"
                  className="bg-neutral-800/50 text-white rounded-xl px-4 py-4 pr-12 border border-neutral-700"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                />
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPwVisible((v) => !v);
                  }}
                  className="absolute right-3 top-3 p-2 rounded-lg bg-neutral-700/50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={pwVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>
            </View>

            {/* Enhanced login button */}
            <Pressable
              onPress={onLogin}
              disabled={loading}
              className="rounded-2xl py-4"
              style={{
                backgroundColor: loading ? signinColor.bg + '80' : signinColor.bg, // Add transparency for loading state
                shadowColor: signinColor.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading ? 0.3 : 0.5,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text className="text-white text-center font-bold text-base">
                {loading ? "Signing in…" : "Sign in"}
              </Text>
            </Pressable>

            {/* Enhanced forgot password link */}
            <View className="mt-6 items-center">
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/authreset");
                }}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-emerald-400 font-medium">
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </Animated.View>
          </Animated.View>
        </GestureDetector>
      )}
      </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}
