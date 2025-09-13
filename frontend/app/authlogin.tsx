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
import ProfileField from "../components/User/ProfileField";
import { apiLogin, storeToken } from "../constants/api";

type Stage = "landing" | "form";

export default function AuthLogin() {
  const [stage, setStage] = useState<Stage>("landing");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const onLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing info", "Please enter email/username and password.");
      return;
    }
    try {
      setLoading(true);
      const { token } = await apiLogin({
        identifier: identifier.trim(),
        password,
      });
      await storeToken(token);
      router.replace("/targetquestions");
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-black">
      {stage === "landing" ? (
        <View className="flex-1 items-center justify-center px-8">
          <Image
            source={require("../assets/images/FuelUpIcon.png")}
            resizeMode="contain"
            className="w-40 h-40 mb-6 rounded-2xl"
          />
          {/* Removed "FuelUp" title text under logo */}
          <Text className="text-gray-300 text-base mb-10 text-center">
            Build healthy habits. Track progress. Fuel your goals.
          </Text>

          <Pressable
            onPress={() => router.push("/authsignup")}
            className="w-full rounded-xl p-3 bg-green-600 mb-3">
            <Text className="text-white text-center font-semibold">
              Get started
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStage("form")}
            className="w-full rounded-xl p-3 border border-green-700">
            <Text className="text-green-400 text-center font-semibold">
              I already have an account
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 px-5 pt-4">
          {/* Back to landing */}
          <Pressable
            onPress={() => setStage("landing")}
            className="absolute left-5"
            style={{ top: 4, zIndex: 50 }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <ArrowLeft size={24} color="white" />
          </Pressable>

          <View className="items-center mt-8 mb-6">
            <Image
              source={require("../assets/images/FuelUpIcon.png")}
              resizeMode="contain"
              className="w-16 h-16 mb-3 rounded-xl"
            />
            <Text className="text-white text-2xl font-bold">Welcome back</Text>
          </View>

          <ProfileField
            label="Email or Username"
            textInputProps={{
              value: identifier,
              onChangeText: setIdentifier,
              autoCapitalize: "none",
              placeholder: "you@example.com or yourname",
            }}
          />

          {/* Password with visibility toggle */}
          <View className="mb-4">
            <Text className="text-gray-300 mb-2">Password</Text>
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
                className="bg-neutral-900 text-white rounded-xl px-4 py-3 pr-12"
              />
              <Pressable
                onPress={() => setPwVisible((v) => !v)}
                className="absolute right-3 top-3 p-1 rounded"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name={pwVisible ? "eye-off" : "eye"}
                  size={22}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={onLogin}
            disabled={loading}
            className={`rounded-xl p-3 ${
              loading ? "bg-green-400" : "bg-green-600"
            }`}>
            <Text className="text-white text-center font-semibold">
              {loading ? "Signing in…" : "Sign in"}
            </Text>
          </Pressable>

          {/* Centered single link */}
          <View className="mt-4 items-center">
            <Pressable onPress={() => router.push("/authreset")}>
              <Text className="text-green-400">Forgot password?</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
