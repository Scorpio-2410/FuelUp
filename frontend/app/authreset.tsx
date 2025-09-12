import React, { useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import ProfileField from "../components/User/ProfileField";
import { apiResetRequest, apiResetConfirm } from "../constants/api";

export default function AuthReset() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"request" | "confirm">("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      Alert.alert("Error", e?.message ?? "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!code.trim() || !newPassword) {
      Alert.alert("Missing info", "Enter the code and a new password.");
      return;
    }
    try {
      setLoading(true);
      await apiResetConfirm({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      Alert.alert("Password updated", "You can log in with your new password.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-5 pt-16">
      <Text className="text-white text-2xl font-bold mb-6">Reset password</Text>

      <ProfileField
        label="Email"
        textInputProps={{
          value: email,
          onChangeText: setEmail,
          autoCapitalize: "none",
          keyboardType: "email-address",
          placeholder: "you@example.com",
        }}
      />

      {stage === "request" ? (
        <Pressable
          onPress={onRequest}
          disabled={loading}
          className={`rounded-xl p-3 ${
            loading ? "bg-blue-400" : "bg-blue-600"
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
              autoCapitalize: "characters",
              placeholder: "123456",
            }}
          />
          <ProfileField
            label="New password"
            textInputProps={{
              value: newPassword,
              onChangeText: setNewPassword,
              secureTextEntry: true,
              placeholder: "••••••••",
            }}
          />
          <Pressable
            onPress={onConfirm}
            disabled={loading}
            className={`rounded-xl p-3 ${
              loading ? "bg-blue-400" : "bg-blue-600"
            }`}>
            <Text className="text-white text-center font-semibold">
              {loading ? "Updating…" : "Update password"}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
