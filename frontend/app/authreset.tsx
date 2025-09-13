// app/authreset.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Alert, Pressable, TextInput } from "react-native";
import { Stack, router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfileField from "../components/User/ProfileField";
import { apiResetRequest, apiResetConfirm } from "../constants/api";

export default function AuthReset() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"request" | "confirm">("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const checks = useMemo(() => {
    const len = newPassword.length >= 8;
    const upper = /[A-Z]/.test(newPassword);
    const lower = /[a-z]/.test(newPassword);
    const number = /\d/.test(newPassword);
    const symbol = /[^A-Za-z0-9]/.test(newPassword);
    const score = [len, upper, lower, number, symbol].filter(Boolean).length;

    let strength: "Weak" | "Medium" | "Strong" = "Weak";
    if (score >= 4 && len) strength = "Strong";
    else if (score >= 2) strength = "Medium";

    const color =
      strength === "Strong"
        ? "text-green-400"
        : strength === "Medium"
        ? "text-gray-300"
        : "text-gray-500";

    return { len, upper, lower, number, symbol, score, strength, color };
  }, [newPassword]);

  const matches = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === newPassword,
    [confirmPassword, newPassword]
  );

  const onRequest = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your account email.");
      return;
    }
    try {
      setLoading(true);
      await apiResetRequest(email.trim());
      setStage("confirm");
      Alert.alert("Code sent", "Check your email for the verification code.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ?? e?.message ?? "Could not send reset code.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!code.trim() || !newPassword) {
      Alert.alert("Missing info", "Enter the code and a new password.");
      return;
    }
    if (!matches) {
      Alert.alert(
        "Passwords do not match",
        "Please re-enter the same password."
      );
      return;
    }
    try {
      setLoading(true);
      await apiResetConfirm({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      Alert.alert(
        "Password updated",
        "You can now log in with your new password.",
        [{ text: "OK", onPress: () => router.replace("/authlogin") }]
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ?? e?.message ?? "Could not reset password.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 px-5 pt-4">
        {/* Back arrow */}
        <Pressable
          onPress={() => router.replace("/authlogin")}
          className="absolute left-5"
          style={{ top: 4, zIndex: 50 }}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <ArrowLeft size={24} color="white" />
        </Pressable>

        <Text className="text-white text-2xl font-bold mb-6 text-center">
          Reset password
        </Text>

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

        {stage === "request" ? (
          <Pressable
            onPress={onRequest}
            disabled={loading}
            className={`rounded-xl p-3 ${
              loading ? "bg-green-400" : "bg-green-600"
            }`}>
            <Text className="text-white text-center font-semibold">
              {loading ? "Sending…" : "Send reset code"}
            </Text>
          </Pressable>
        ) : (
          <>
            <ProfileField
              label="Verification code"
              textInputProps={{
                value: code,
                onChangeText: setCode,
                autoCapitalize: "none",
                keyboardType: "number-pad",
                placeholder: "123456",
                maxLength: 6,
              }}
            />

            {/* New password with visibility toggle */}
            <View className="mb-2">
              <Text className="text-gray-300 mb-2">New password</Text>
              <View className="relative">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!pwVisible}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="oneTimeCode"
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

            {/* Password strength checklist */}
            <View className="mb-4">
              <Text className={`text-xs font-semibold ${checks.color} mb-1`}>
                Password strength: {checks.strength}
              </Text>
              <View className="gap-1">
                <Text
                  className={`text-xs ${
                    checks.len ? "text-green-400" : "text-gray-500"
                  }`}>
                  • At least 8 characters
                </Text>
                <Text
                  className={`text-xs ${
                    checks.upper ? "text-green-400" : "text-gray-500"
                  }`}>
                  • One uppercase letter
                </Text>
                <Text
                  className={`text-xs ${
                    checks.lower ? "text-green-400" : "text-gray-500"
                  }`}>
                  • One lowercase letter
                </Text>
                <Text
                  className={`text-xs ${
                    checks.number ? "text-green-400" : "text-gray-500"
                  }`}>
                  • One number
                </Text>
                <Text
                  className={`text-xs ${
                    checks.symbol ? "text-green-400" : "text-gray-500"
                  }`}>
                  • One symbol
                </Text>
              </View>
            </View>

            {/* Confirm password (no visibility toggle) */}
            <View className="mb-2">
              <Text className="text-gray-300 mb-2">Confirm password</Text>
              <View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="oneTimeCode"
                  className="bg-neutral-900 text-white rounded-xl px-4 py-3"
                />
              </View>
            </View>
            <Text
              className={`text-xs mb-4 ${
                matches ? "text-green-400" : "text-gray-500"
              }`}>
              {matches ? "Passwords match" : "Passwords must match"}
            </Text>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className={`rounded-xl p-3 ${
                loading ? "bg-green-400" : "bg-green-600"
              }`}>
              <Text className="text-white text-center font-semibold">
                {loading ? "Updating…" : "Update password"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
