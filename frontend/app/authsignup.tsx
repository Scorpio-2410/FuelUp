import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  Pressable,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfileField from "../components/User/ProfileField";
import { apiCheckEmail, apiCheckUsername } from "../constants/api";

export default function AuthSignup() {
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameChecking, setUsernameChecking] = useState(false);

  const [email, setEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const insets = useSafeAreaInsets();

  const usernameFormatOk = useMemo(
    () => /^[A-Za-z0-9_]{3,20}$/.test(username.trim()),
    [username]
  );
  const emailFormatOk = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  // Debounced username check
  useEffect(() => {
    let t: any;
    const u = username.trim();
    if (!u) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }
    if (!usernameFormatOk) {
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }
    setUsernameChecking(true);
    t = setTimeout(async () => {
      try {
        const { available } = await apiCheckUsername(u);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, usernameFormatOk]);

  // Debounced email check
  useEffect(() => {
    let t: any;
    const e = email.trim();
    if (!e) {
      setEmailAvailable(null);
      setEmailChecking(false);
      return;
    }
    if (!emailFormatOk) {
      setEmailAvailable(false);
      setEmailChecking(false);
      return;
    }
    setEmailChecking(true);
    t = setTimeout(async () => {
      try {
        const { available } = await apiCheckEmail(e);
        setEmailAvailable(available);
      } catch {
        setEmailAvailable(false);
      } finally {
        setEmailChecking(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [email, emailFormatOk]);

  const checks = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /\d/.test(password);
    const symbol = /[^A-Za-z0-9]/.test(password);
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

    return { len, upper, lower, number, symbol, strength, color };
  }, [password]);

  const matches = useMemo(
    () => confirm.length > 0 && confirm === password,
    [confirm, password]
  );

  // Defer account creation — pass creds to onboarding (which now signs up)
  const onSignup = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Enter username, email, and password.");
      return;
    }
    if (!usernameFormatOk) {
      Alert.alert("Username", "Use 3–20 chars: letters, numbers, underscore.");
      return;
    }
    if (usernameAvailable === false) {
      Alert.alert("Username", "This username is already taken.");
      return;
    }
    if (!emailFormatOk) {
      Alert.alert("Email", "Enter a valid email address.");
      return;
    }
    if (emailAvailable === false) {
      Alert.alert("Email", "An account with this email already exists.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match", "Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      router.replace({
        pathname: "/onboarding",
        params: { u: username.trim(), e: email.trim(), p: password },
      });
    } finally {
      setLoading(false);
    }
  };

  const disableSignup =
    loading ||
    !username.trim() ||
    !email.trim() ||
    !password ||
    !matches ||
    !usernameFormatOk ||
    usernameAvailable === false ||
    usernameChecking ||
    !emailFormatOk ||
    emailAvailable === false ||
    emailChecking;

  return (
    <SafeAreaView
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-black"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "black" }}
          keyboardVerticalOffset={insets.top}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-5 pt-4">
              <Pressable
                onPress={() => router.replace("/authlogin")}
                className="absolute left-5"
                style={{ top: 4, zIndex: 50 }}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <ArrowLeft size={24} color="white" />
              </Pressable>

              <Text className="text-white text-2xl font-bold mb-6 text-center">
                Create account
              </Text>

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
              <Text
                className={`text-xs mb-3 ${
                  !username.trim()
                    ? "text-gray-500"
                    : usernameChecking
                    ? "text-gray-400"
                    : usernameFormatOk && usernameAvailable
                    ? "text-green-400"
                    : "text-gray-500"
                }`}
              >
                {!username.trim()
                  ? "Enter a username (3–20 letters, numbers, underscore)."
                  : usernameChecking
                  ? "Checking availability…"
                  : !usernameFormatOk
                  ? "Use 3–20 chars: letters, numbers, underscore."
                  : usernameAvailable
                  ? "Username available"
                  : "Username not available"}
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
              <Text
                className={`text-xs mb-3 ${
                  !email.trim()
                    ? "text-gray-500"
                    : emailChecking
                    ? "text-gray-400"
                    : emailFormatOk && emailAvailable
                    ? "text-green-400"
                    : "text-gray-500"
                }`}
              >
                {!email.trim()
                  ? "Enter a valid email address."
                  : emailChecking
                  ? "Checking email…"
                  : !emailFormatOk
                  ? "Email format looks invalid."
                  : emailAvailable
                  ? "Email is available"
                  : "Email is already in use"}
              </Text>

              <View className="mb-2">
                <Text className="text-gray-300 mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    className="bg-neutral-900 text-white rounded-xl px-4 py-3 pr-12"
                  />
                  <Pressable
                    onPress={() => setPasswordVisible((v) => !v)}
                    className="absolute right-3 top-3 p-1 rounded"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={passwordVisible ? "eye-off" : "eye"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              </View>

              <View className="mb-4">
                <Text className={`text-xs font-semibold ${checks.color} mb-1`}>
                  Password strength: {checks.strength}
                </Text>
                <View className="gap-1">
                  <Text
                    className={`text-xs ${
                      checks.len ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    • At least 8 characters
                  </Text>
                  <Text
                    className={`text-xs ${
                      checks.upper ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    • One uppercase letter
                  </Text>
                  <Text
                    className={`text-xs ${
                      checks.lower ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    • One lowercase letter
                  </Text>
                  <Text
                    className={`text-xs ${
                      checks.number ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    • One number
                  </Text>
                  <Text
                    className={`text-xs ${
                      checks.symbol ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    • One symbol
                  </Text>
                </View>
              </View>

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
                  textContentType: "oneTimeCode",
                  passwordRules: "",
                  importantForAutofill: "no",
                }}
              />
              <Text
                className={`text-xs mb-4 ${
                  matches ? "text-green-400" : "text-gray-500"
                }`}
              >
                {matches ? "Passwords match" : "Passwords must match"}
              </Text>

              <Pressable
                onPress={onSignup}
                disabled={disableSignup}
                className={`rounded-xl p-3 ${
                  disableSignup ? "bg-green-400" : "bg-green-600"
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {loading ? "Creating…" : "Sign up"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
