import React, { useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import { router, Link } from "expo-router";
import ProfileField from "../components/User/ProfileField";
import { apiSignup, storeToken } from "../constants/api";

export default function AuthSignup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Enter username, email, and password.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match", "Please re-enter.");
      return;
    }
    try {
      setLoading(true);
      const { token } = await apiSignup({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await storeToken(token);
      router.replace("/onboarding"); // after SIGNUP → Phase 2
    } catch (e: any) {
      Alert.alert("Signup failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-5 pt-16">
      <Text className="text-white text-2xl font-bold mb-6">Create account</Text>

      <ProfileField
        label="Username"
        textInputProps={{
          value: username,
          onChangeText: setUsername,
          placeholder: "yourname",
          autoCapitalize: "none",
          autoCorrect: false,
        }}
      />

      <ProfileField
        label="Email"
        textInputProps={{
          value: email,
          onChangeText: setEmail,
          autoCapitalize: "none",
          keyboardType: "email-address",
          placeholder: "you@example.com",
          autoCorrect: false,
          textContentType: "emailAddress",
          autoComplete: "email",
        }}
      />

      {/* Suppress iOS Strong Password banner */}
      <ProfileField
        label="Password"
        textInputProps={{
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          placeholder: "••••••••",
          autoCapitalize: "none",
          autoCorrect: false,
          autoComplete: "off",
          textContentType: "oneTimeCode", // iOS trick to suppress strong password UI
          passwordRules: "", // iOS: prevent suggested strong password
          importantForAutofill: "no", // Android
        }}
      />

      {/* Suppress iOS Strong Password banner */}
      <ProfileField
        label="Confirm password"
        textInputProps={{
          value: confirm,
          onChangeText: setConfirm,
          secureTextEntry: true,
          placeholder: "••••••••",
          autoCapitalize: "none",
          autoCorrect: false,
          autoComplete: "off",
          textContentType: "oneTimeCode", // iOS trick to suppress strong password UI
          passwordRules: "", // iOS
          importantForAutofill: "no", // Android
        }}
      />

      <Pressable
        onPress={onSignup}
        disabled={loading}
        className={`rounded-xl p-3 ${loading ? "bg-blue-400" : "bg-blue-600"}`}>
        <Text className="text-white text-center font-semibold">
          {loading ? "Creating…" : "Sign up"}
        </Text>
      </Pressable>

      <View className="mt-4">
        <Link href="/authlogin">
          <Text className="text-blue-400">Already have an account? Log in</Text>
        </Link>
      </View>
    </View>
  );
}
