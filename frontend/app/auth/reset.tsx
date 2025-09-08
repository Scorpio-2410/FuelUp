import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";

const API_BASE = "http://localhost:4000";

export default function ResetScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onReset = async () => {
    setErr(null);
    setMsg(null);
    if (!email) return setErr("Email is required");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setMsg("If the email exists, a reset link has been sent.");
    } catch (e: any) {
      setErr(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        backgroundColor: "#1a1a1a",
        justifyContent: "center",
      }}>
      <Text
        style={{
          color: "#B3FF6E",
          fontSize: 24,
          fontWeight: "800",
          textAlign: "center",
          marginBottom: 16,
        }}>
        Reset password
      </Text>

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#888"
        style={{
          backgroundColor: "#111",
          color: "white",
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: "#2a2a2a",
        }}
      />

      {err ? (
        <Text style={{ color: "#fda4af", marginBottom: 8 }}>{err}</Text>
      ) : null}
      {msg ? (
        <Text style={{ color: "#4ade80", marginBottom: 8 }}>{msg}</Text>
      ) : null}

      <TouchableOpacity
        onPress={onReset}
        disabled={loading}
        style={{
          backgroundColor: "#4ade80",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 4,
        }}>
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={{ color: "black", fontWeight: "800" }}>
            Send reset link
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Link href="/auth/login" style={{ color: "#B3FF6E" }}>
          Back to login
        </Link>
      </View>
    </View>
  );
}
