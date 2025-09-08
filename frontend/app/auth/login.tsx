import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://localhost:4000"; // update if physical device

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onLogin = async () => {
    setErr(null);
    if (!identifier || !password) {
      return setErr("Email/username and password are required");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier, // 👈 matches backend
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Login failed");

      // save token
      await AsyncStorage.setItem("authToken", json.token);

      // redirect into the app
      router.replace("/targetquestions");
    } catch (e: any) {
      setErr(e.message || "Login failed");
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
          fontSize: 28,
          fontWeight: "800",
          textAlign: "center",
          marginBottom: 24,
        }}>
        FuelUp
      </Text>

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>
        Email or Username
      </Text>
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        placeholder="you@example.com"
        placeholderTextColor="#888"
        style={{
          backgroundColor: "#111",
          color: "white",
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#2a2a2a",
        }}
      />

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        placeholder="Enter password"
        placeholderTextColor="#888"
        secureTextEntry={false} // 👈 show plain input
        style={{
          backgroundColor: "#111",
          color: "white",
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#2a2a2a",
        }}
      />

      {err ? (
        <Text style={{ color: "#fda4af", marginTop: 10 }}>{err}</Text>
      ) : null}

      <TouchableOpacity
        onPress={onLogin}
        disabled={loading}
        style={{
          backgroundColor: "#4ade80",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 18,
        }}>
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={{ color: "black", fontWeight: "800" }}>Log in</Text>
        )}
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}>
        <Link href="/auth/signup" style={{ color: "#B3FF6E" }}>
          Create account
        </Link>
        <Link href="/auth/reset" style={{ color: "#B3FF6E" }}>
          Forgot password?
        </Link>
      </View>
    </View>
  );
}
