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

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSignup = async () => {
    setErr(null);
    if (!fullName || !username || !email || !password) {
      return setErr("All fields are required");
    }
    if (password !== confirm) {
      return setErr("Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, // 👈 backend expects this
          username,
          email,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Sign up failed");

      // save token & go to questions directly
      await AsyncStorage.setItem("authToken", json.token);
      router.replace("/targetquestions");
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
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
        Create your FuelUp account
      </Text>

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>Full name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Jane Doe"
        autoCapitalize="words"
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

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="janedoe"
        autoCapitalize="none"
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

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
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
        placeholder="Enter password"
        autoCapitalize="none"
        placeholderTextColor="#888"
        secureTextEntry={false} // 👈 show while typing (no auto-suggest overlay)
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

      <Text style={{ color: "#B3FF6E", marginBottom: 6 }}>
        Confirm password
      </Text>
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter password"
        autoCapitalize="none"
        placeholderTextColor="#888"
        secureTextEntry={false}
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
        onPress={onSignup}
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
          <Text style={{ color: "black", fontWeight: "800" }}>Sign up</Text>
        )}
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Link href="/auth/login" style={{ color: "#B3FF6E" }}>
          Already have an account? Log in
        </Link>
      </View>
    </View>
  );
}
