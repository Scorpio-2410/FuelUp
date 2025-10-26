// app/onboarding.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import {
  apiGetMe,
  apiUpdateMe,
  apiUpsertFitnessProfile,
  apiUpsertNutritionProfile,
  writeProfileCache,
  apiSignup,
  storeToken,
} from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ProfileForm from "../components/User/ProfileForm";
import FitnessStep from "../components/Onboarding/FitnessStep";
import NutritionStep, {
  NutritionDraft,
} from "../components/Onboarding/NutritionStep";

type Step = "profile" | "fitness" | "nutrition";

function Header({
  title,
  canGoBack,
  onBack,
}: {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
}) {
  // Conditionally adjust left padding and margin for 'Your profile' only
  const leftPad = title === "Your profile" ? 0 : 20;
  const leftMargin = title === "Your profile" ? -8 : 0;
  return (
    <SafeAreaView style={{ backgroundColor: "#000" }}>
      <View
        style={{
          marginLeft: leftMargin,
          paddingLeft: leftPad,
          paddingRight: 0,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "#000",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {canGoBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={{ marginRight: 12 }}>
            <ArrowLeft size={24} color="white" />
          </Pressable>
        ) : (
          <View style={{ width: 24, height: 24, marginRight: 12 }} />
        )}
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const normalizeDate = (s?: string | null) =>
  !s ? null : /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : String(s).slice(0, 10);

function ProfileFormAdapter({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  return <ProfileForm profile={value} setProfile={onChange} />;
}

/** helpers */
const toKg = (val: string, unit: "kg" | "lb") => {
  const n = Number(val);
  if (!n || isNaN(n)) return NaN;
  return unit === "kg" ? Math.round(n) : Math.round(n * 0.45359237);
};
function parseFtInchesToCm(raw: string): number {
  const s = String(raw).trim();
  if (!s) return NaN;
  let feet = NaN;
  let inches = 0;
  const two = s.match(/(\d+)\D+(\d+)/);
  if (two) {
    feet = parseInt(two[1], 10);
    inches = parseInt(two[2], 10);
  } else {
    const one = s.match(/(\d+)/);
    if (one) feet = parseInt(one[1], 10);
  }
  if (Number.isNaN(feet)) return NaN;
  if (inches < 0 || inches > 11) inches = Math.max(0, Math.min(11, inches));
  const cm = (feet * 12 + inches) * 2.54;
  return Math.round(cm);
}

export default function Onboarding() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false });
  }, [navigation]);

  const params = useLocalSearchParams<{ u?: string; e?: string; p?: string }>();
  const signupUsername = useMemo(
    () => (params.u ? String(params.u) : ""),
    [params.u]
  );
  const signupEmail = useMemo(
    () => (params.e ? String(params.e) : ""),
    [params.e]
  );
  const signupPassword = useMemo(
    () => (params.p ? String(params.p) : ""),
    [params.p]
  );

  const [step, setStep] = useState<Step>("profile");
  const [loadingMe, setLoadingMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState<any>({
    username: signupUsername || "",
    fullName: "",
    email: signupEmail || "",
    dob: "",
    gender: "",
    ethnicity: "",
    followUpFrequency: "daily",
    notifications: true,
    avatarUri: undefined as string | undefined,
  });

  const [fitness, setFitness] = useState<any>({
    goal: "general_health",
    activityLevel: "moderate",
    daysPerWeek: "",
    height: "",
    weight: "",
    heightUnit: "cm" as "cm" | "ft",
    weightUnit: "kg" as "kg" | "lb",
  });

  const [nutrition, setNutrition] = useState<NutritionDraft>({
    prefCuisines: [] as string[],
    dietRestrictions: [] as string[],
  });

  // if returning user (already logged), prefill
  useEffect(() => {
    (async () => {
      try {
        setLoadingMe(true);
        try {
          const { user: u } = await apiGetMe();
          if (u) {
            setUser((prev: any) => ({
              ...prev,
              username: u.username ?? prev.username,
              fullName: u.fullName ?? "",
              email: u.email ?? prev.email,
              dob: u.dob ? String(u.dob).slice(0, 10) : "",
              gender: u.gender ?? "prefer_not_to_say",
              ethnicity: u.ethnicity ?? "not_specified",
              followUpFrequency: u.followUpFrequency ?? "daily",
              notifications: Boolean(u.notificationsEnabled ?? true),
              avatarUri: u.avatarUri ?? undefined,
            }));
          }
        } catch {}
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  const goBack = () => {
    setStep((s) =>
      s === "profile" ? "profile" : s === "fitness" ? "profile" : "fitness"
    );
  };
  const goNext = () => {
    setStep((s) =>
      s === "profile" ? "fitness" : s === "fitness" ? "nutrition" : "nutrition"
    );
  };

  // simple validators
  const validateProfile = (profile: any) => {
    if (!profile.username || profile.username.trim().length < 1)
      return "Enter your username.";
    if (!profile.fullName || profile.fullName.trim().length < 2)
      return "Enter your full name.";
    if (!profile.dob || !/^\d{4}-\d{2}-\d{2}$/.test(profile.dob))
      return "Enter a valid date of birth.";
    if (!profile.gender) return "Select your gender.";
    if (!profile.ethnicity || profile.ethnicity === "not_specified")
      return "Select your ethnicity.";
    return null;
  };

  const validateFitness = () => {
    const days = parseInt(String(fitness.daysPerWeek || ""), 10);
    if (!days || days < 1 || days > 7)
      return "Please select days per week (1–7).";
    const heightCm =
      (fitness.heightUnit as "cm" | "ft") === "cm"
        ? Math.round(Number(fitness.height))
        : parseFtInchesToCm(fitness.height);
    const weightKg = toKg(String(fitness.weight || ""), fitness.weightUnit);
    if (!heightCm || heightCm < 80 || heightCm > 250)
      return "Enter a valid height.";
    if (!weightKg || weightKg < 30 || weightKg > 400)
      return "Enter a valid weight.";
    return null;
  };

  const validateNutrition = () => {
    if (!nutrition.prefCuisines.length && !nutrition.dietRestrictions.length) {
      return "Pick at least one preference or restriction.";
    }
    return null;
  };

  const redirectToStart = (msg: string) => {
    Alert.alert("Registration failed", msg, [
      {
        text: "OK",
        onPress: () => router.replace("/"),
      },
    ]);
  };

  const onFinish = useCallback(async () => {
    try {
      setSubmitting(true);

      const fErr = validateFitness();
      if (fErr) {
        setStep("fitness");
        Alert.alert("Missing info", fErr);
        setSubmitting(false);
        return;
      }
      const nErr = validateNutrition();
      if (nErr) {
        setStep("nutrition");
        Alert.alert("Missing info", nErr);
        setSubmitting(false);
        return;
      }

      if (!signupUsername || !signupEmail || !signupPassword) {
        redirectToStart(
          "Missing signup credentials. Please start again from the first screen."
        );
        setSubmitting(false);
        return;
      }

      // 1) Register + login
      let token, created;
      try {
        const resp = await apiSignup({
          username: signupUsername.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        });
        token = resp.token;
        created = resp.user;
        await storeToken(token);
        if (created) await writeProfileCache(created);
      } catch (e: any) {
        redirectToStart(e?.message || "Unable to create account.");
        return;
      }

      // 2) Convert body stats
      const heightCm =
        (fitness.heightUnit as "cm" | "ft") === "cm"
          ? Math.round(Number(fitness.height))
          : parseFtInchesToCm(fitness.height);
      const weightKg = toKg(String(fitness.weight || ""), fitness.weightUnit);

      // 3) Save user profile
      try {
        await apiUpdateMe({
          username: user.username || null,
          full_name: user.fullName || null,
          dob: normalizeDate(user.dob),
          gender: user.gender || null,
          avatar_uri: user.avatarUri || null,
          notifications_enabled: !!user.notifications,
          follow_up_frequency: user.followUpFrequency || null,
          ethnicity: user.ethnicity || null,
        });
      } catch (e: any) {
        redirectToStart(e?.message || "Failed to save profile");
        return;
      }

      // 4) Save fitness
      try {
        await apiUpsertFitnessProfile({
          goal: fitness.goal || "general_health",
          activityLevel: fitness.activityLevel || "moderate",
          daysPerWeek: fitness.daysPerWeek
            ? parseInt(fitness.daysPerWeek, 10)
            : null,
          heightCm: Number.isNaN(heightCm) ? null : heightCm,
          weightKg: Number.isNaN(weightKg) ? null : weightKg,
        });

        // Save user's unit preference so Fitness Profile remembers it
        try {
          console.log("[Onboarding] Saving unit prefs:", {
            heightUnit: fitness.heightUnit || "cm",
            weightUnit: fitness.weightUnit || "kg",
          });
          await AsyncStorage.setItem(
            "fu_pref_height_unit",
            fitness.heightUnit || "cm"
          );
          await AsyncStorage.setItem(
            "fu_pref_weight_unit",
            fitness.weightUnit || "kg"
          );
        } catch (e) {
          console.warn("[Onboarding] Failed to save unit prefs:", e);
        }
      } catch (e: any) {
        redirectToStart(e?.message || "Failed to save fitness details");
        return;
      }

      // 5) Save nutrition — allow continuing if route isn't mounted yet
      try {
        await apiUpsertNutritionProfile({
          dailyCalorieTarget: null,
          macros: null,
          prefCuisines: nutrition.prefCuisines.length
            ? nutrition.prefCuisines.join(", ")
            : null,
          dietRestrictions: nutrition.dietRestrictions.length
            ? nutrition.dietRestrictions.join(", ")
            : null,
        });
      } catch (e: any) {
        console.warn("Nutrition profile save skipped:", e?.message || e);
      }

      // success → to homepage
      try {
        const { user: fresh } = await apiGetMe();
        if (fresh) await writeProfileCache(fresh);
      } catch {}
      router.replace("/(tabs)/homepage");
    } finally {
      setSubmitting(false);
    }
  }, [signupUsername, signupEmail, signupPassword, user, fitness, nutrition]);

  if (loadingMe) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Header
        title={
          step === "profile"
            ? "Your profile"
            : step === "fitness"
            ? "Your fitness"
            : "Your nutrition"
        }
        canGoBack={step !== "profile"}
        onBack={goBack}
      />

      <ScrollView className="flex-1 px-5">
        {step === "profile" && (
          <>
            <ProfileFormAdapter value={user} onChange={setUser} />
            <Pressable
              onPress={() => {
                const err = validateProfile(user);
                if (err) {
                  Alert.alert("Missing info", err);
                  return;
                }
                goNext();
              }}
              disabled={!!validateProfile(user)}
              className={`rounded-xl p-3 my-8 bg-green-600 ${
                validateProfile(user) ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white text-center font-semibold">
                Continue
              </Text>
            </Pressable>
          </>
        )}

        {step === "fitness" && (
          <>
            <FitnessStep value={fitness} onChange={setFitness} />
            <Pressable
              onPress={() => {
                const err = validateFitness();
                if (err) {
                  return;
                }
                goNext();
              }}
              disabled={!!validateFitness()}
              className={`rounded-xl p-3 my-8 bg-green-600 ${
                validateFitness() ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white text-center font-semibold">
                Continue
              </Text>
            </Pressable>
          </>
        )}

        {step === "nutrition" && (
          <NutritionStep
            value={nutrition}
            onChange={setNutrition}
            onSubmit={onFinish}
            submitLabel={submitting ? "Registering..." : "Complete onboarding"}
          />
        )}
      </ScrollView>
    </View>
  );
}
