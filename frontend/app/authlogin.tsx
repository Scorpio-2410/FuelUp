// app/authlogin.tsx
import React, { useState } from "react";
import { View, Text, Alert, Pressable, Image, TextInput, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SwipeNavigate from "../components/SwipeNavigate";
import { useAnimatedStyle, withRepeat, withSpring, withTiming, withSequence } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import ProfileField from "../components/User/ProfileField";
import AnimatedBackground from "../components/Auth/AnimatedBackground";
import FeatureCard from "../components/Auth/FeatureCard";
import { apiLogin, storeToken } from "../constants/api";

// Features for the landing page
const FEATURES = [
  {
    icon: '🍽️',
    title: 'Nutrition & Meals',
    description: 'Culturally-aware recipes, meal plans & tracking',
    color: '#10B981',
  },
  {
    icon: '💪',
    title: 'Smart Workouts',
    description: 'Adaptive plans with video guides',
    color: '#3B82F6',
  },
  {
    icon: '📊',
    title: 'Track Progress',
    description: 'Steps, calories, charts & scheduling',
    color: '#8B5CF6',
  },
  {
    icon: '🎯',
    title: 'Stay Motivated',
    description: 'Daily quotes & goal tracking',
    color: '#F59E0B',
  },
];

type Stage = "landing" | "form";

// Color options for sign-in buttons
const SIGNIN_COLORS = {
  blue: { bg: '#3B82F6', shadow: '#3B82F6' },
  orange: { bg: '#F97316', shadow: '#F97316' },
  purple: { bg: '#8B5CF6', shadow: '#8B5CF6' },
};
const SELECTED_SIGNIN_COLOR: 'blue' | 'orange' | 'purple' = 'blue';

export default function AuthLogin() {
  const [stage, setStage] = useState<Stage>("landing");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const signinColor = SIGNIN_COLORS[SELECTED_SIGNIN_COLOR];

  // Floating animation for logo
  const floatingAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withRepeat(
            withSequence(
              withTiming(-8, { duration: 2000 }),
              withTiming(8, { duration: 2000 })
            ),
            -1,
            true
          )
        }
      ]
    };
  });

  // Arrow animation for button
  const arrowAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withRepeat(
            withSequence(
              withTiming(4, { duration: 1000 }),
              withTiming(0, { duration: 1000 })
            ),
            -1,
            true
          )
        }
      ]
    };
  });


  const onLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing info", "Please enter email/username and password.");
      return;
    }

    setLoading(true);
    try {
      const { token } = await apiLogin({ identifier: identifier.trim(), password });
      await storeToken(token);
      router.replace("/(tabs)/homepage" as any);
    } catch (error: any) {
      Alert.alert("Login failed", error?.message || "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SwipeNavigate
      currentTabIndex={stage === 'landing' ? 0 : 1}
      totalTabs={2}
      onTabChange={(index) => {
        if (index === 0 && stage === 'form') {
          setStage('landing');
        }
      }}
      swipeThreshold={80}
      velocityThreshold={400}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: '#0A0A0A' }}
          className="flex-1"
        >
            {stage === "landing" ? (
              <View className="flex-1">
                {/* Animated Background */}
                <AnimatedBackground stage={stage} />
                
                {/* ScrollView for full content */}
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{}}
                >
                  {/* Logo with animation */}
                  <Animated.View
                    entering={FadeIn.duration(800)}
                    className="items-center px-8 pt-8 pb-6"
                  >
                    <Animated.View style={floatingAnimation}>
                      <Image
                        source={require("../assets/images/FuelUpIcon.png")}
                        resizeMode="contain"
                        className="w-40 h-40 mb-4 rounded-2xl"
                        style={{
                          shadowColor: "#10B981",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.3,
                          shadowRadius: 16,
                        }}
                      />
                    </Animated.View>
                    <Text className="text-gray-300 text-lg font-semibold text-center leading-6 mb-2">
                      Build healthy habits. Track progress. Fuel your goals.
                    </Text>
                    <Text className="text-gray-500 text-sm text-center">
                      Your personal fitness companion
                    </Text>
                  </Animated.View>

                  {/* Feature Cards */}
                  <Animated.View
                    entering={FadeInDown.delay(400).duration(600)}
                    className="px-6 py-4"
                  >
                    <View style={{ gap: 12 }}>
                      {/* Row 1: Nutrition & Meals | Smart Workouts */}
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <FeatureCard feature={FEATURES[0]} index={0} style={{ flex: 1 }} />
                        <FeatureCard feature={FEATURES[1]} index={1} style={{ flex: 1 }} />
                      </View>
                      
                      {/* Row 2: Track Progress | Stay Motivated */}
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <FeatureCard feature={FEATURES[2]} index={2} style={{ flex: 1 }} />
                        <FeatureCard feature={FEATURES[3]} index={3} style={{ flex: 1 }} />
                      </View>
                    </View>
                  </Animated.View>

                  {/* Enhanced buttons */}
                  <Animated.View
                    entering={FadeInDown.delay(1000).duration(600)}
                    className="px-8 pt-6 pb-8"
                  >
                    {/* Subtle divider */}
                    <View className="w-full h-px bg-gray-700/50 mb-6" />
                    
                    <View style={{ gap: 16 }}>
                      {/* Get Started button - fully rounded */}
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push("/authsignup");
                        }}
                        className="w-full py-4"
                        style={{
                          borderRadius: 100,
                          backgroundColor: '#10B981',
                          shadowColor: "#10B981",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.4,
                          shadowRadius: 12,
                          elevation: 8,
                        }}
                      >
                        <Text className="text-white text-center font-bold text-lg">
                          Get Started
                        </Text>
                      </Pressable>

                      {/* Sign in button */}
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setStage("form");
                        }}
                        className="w-full py-4"
                        style={{
                          borderRadius: 100,
                          backgroundColor: signinColor.bg,
                          shadowColor: signinColor.shadow,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.4,
                          shadowRadius: 12,
                          elevation: 8,
                        }}
                      >
                        <Text className="text-white text-center font-semibold text-lg">
                          I already have an account
                        </Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                </ScrollView>
              </View>
            ) : (
              <View className="flex-1">
                {/* Animated Background */}
                <AnimatedBackground stage={stage} />
                
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                >
                <Animated.View 
                  entering={ZoomIn.duration(400).springify()}
                  className="px-5 pt-4"
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
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <ArrowLeft size={20} color="white" />
                  </Pressable>

                  {/* Header */}
                  <Animated.View
                    entering={FadeInDown.delay(200).duration(600)}
                    className="items-center mt-8 mb-8"
                  >
                    <Image
                      source={require("../assets/images/FuelUpIcon.png")}
                      resizeMode="contain"
                      className="w-16 h-16 mb-4 rounded-xl"
                      style={{
                        shadowColor: "#3B82F6",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.4,
                        shadowRadius: 16,
                      }}
                    />
                    <View className="items-center">
                      <Text className="text-white text-3xl font-black mb-2">Welcome back</Text>
                      <View className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                    </View>
                  </Animated.View>

                  {/* Login form */}
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <Animated.View
                      entering={FadeInDown.delay(400).duration(600)}
                      className="bg-neutral-900/98 rounded-3xl p-8 border border-neutral-700"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 16 },
                        shadowOpacity: 0.5,
                        shadowRadius: 32,
                        elevation: 12,
                      }}
                    >
                    <ProfileField
                      label="Email or Username"
                      textInputProps={{
                        value: identifier,
                        onChangeText: setIdentifier,
                        placeholder: "Enter your email or username",
                        autoCapitalize: "none",
                        autoCorrect: false,
                        autoComplete: "off",
                      }}
                    />

                    <ProfileField
                      label="Password"
                      textInputProps={{
                        value: password,
                        onChangeText: setPassword,
                        secureTextEntry: !pwVisible,
                        placeholder: "Enter your password",
                        autoCapitalize: "none",
                        autoCorrect: false,
                        autoComplete: "off",
                        textContentType: "password",
                      }}
                      rightAccessory={
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPwVisible(!pwVisible);
                          }}
                          className="p-2 rounded-lg bg-neutral-700"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <Ionicons
                            name={pwVisible ? "eye-off" : "eye"}
                            size={18}
                            color="#9CA3AF"
                          />
                        </Pressable>
                      }
                    />

                    <Pressable
                      onPress={onLogin}
                      disabled={loading}
                      className="rounded-2xl py-5 mt-2 bg-emerald-500"
                      style={{
                        shadowColor: "#10B981",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 8,
                      }}
                    >
                      <Text className="text-white text-center font-bold text-lg tracking-wide">
                        {loading ? "Signing in..." : "SIGN IN"}
                      </Text>
                    </Pressable>

                    <View className="mt-8 items-center">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push("/authreset");
                        }}
                        className="px-4 py-2"
                      >
                        <Text className="text-blue-400 font-semibold text-sm tracking-wide">
                          Forgot password?
                        </Text>
                      </Pressable>
                    </View>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </Animated.View>
                </ScrollView>
              </View>
            )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </SwipeNavigate>
  );
}