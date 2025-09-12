import React, { useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import { router, Link } from "expo-router";
import ProfileField from "../components/User/ProfileField";
import { apiLogin, storeToken } from "../constants/api";

export default function AuthLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.replace("/targetquestions"); // after LOGIN
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-5 pt-16">
      <Text className="text-white text-2xl font-bold mb-6">Welcome back</Text>

      <ProfileField
        label="Email or Username"
        textInputProps={{
          value: identifier,
          onChangeText: setIdentifier,
          autoCapitalize: "none",
          placeholder: "you@example.com or yourname",
        }}
      />
      <ProfileField
        label="Password"
        textInputProps={{
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          placeholder: "••••••••",
        }}
      />

      <Pressable
        onPress={onLogin}
        disabled={loading}
        className={`rounded-xl p-3 ${loading ? "bg-blue-400" : "bg-blue-600"}`}>
        <Text className="text-white text-center font-semibold">
          {loading ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>

      <View className="flex-row justify-between mt-4">
        <Link href="/authreset">
          <Text className="text-blue-400">Forgot password?</Text>
        </Link>
        <Link href="/authsignup">
          <Text className="text-blue-400">Create account</Text>
        </Link>
      </View>
    </View>
  );
}
