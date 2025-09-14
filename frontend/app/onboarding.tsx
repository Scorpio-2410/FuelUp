import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import {
  apiGetMe,
  apiUpdateMe,
  apiUpsertFitnessProfile,
  apiUpsertNutritionProfile,
  writeProfileCache,
  apiSignup,
  storeToken,
} from "../constants/api";

import ProfileForm from "../components/User/ProfileForm";
import FitnessStep from "../components/Onboarding/FitnessStep";
import NutritionStep from "../components/Onboarding/NutritionStep";

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
  return (
    <View className="px-5 pt-12 pb-4 bg-black flex-row items-center">
      {canGoBack ? (
        <Pressable onPress={onBack} hitSlop={12} className="mr-3">
          <ArrowLeft size={24} color="white" />
        </Pressable>
      ) : (
        <View style={{ width: 24, height: 24, marginRight: 12 }} />
      )}
      <Text className="text-white text-2xl font-bold">{title}</Text>
    </View>
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

export default function Onboarding() {
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
  const [didAttemptSignup, setDidAttemptSignup] = useState(false);

  const [user, setUser] = useState<any>({
    username: "",
    fullName: "",
    email: "",
    dob: "",
    gender: "prefer_not_to_say",
    ethnicity: "not_specified",
    followUpFrequency: "daily",
    notifications: true,
    avatarUri: undefined as string | undefined,
  });

  const [fitness, setFitness] = useState<any>({
    goal: "general_health",
    activityLevel: "moderate",
    experienceLevel: "",
    daysPerWeek: "",
    sessionLengthMin: "",
    trainingLocation: "",
    equipmentAvailable: "",
    preferredActivities: "",
    injuriesOrLimitations: "",
    coachingStyle: "balanced",
    heightCm: "",
    weightKg: "",
  });

  const [nutrition, setNutrition] = useState<any>({
    dailyCalorieTarget: "",
    macrosProtein: "",
    macrosCarbs: "",
    macrosFat: "",
    prefCuisines: "",
    dietRestrictions: "",
    dislikedFoods: "",
    allergies: "",
  });

  /**
   * Boot: if we arrived from AuthSignup with creds (u,e,p), create the account,
   * store the token, then load / prefill the user.
   * Otherwise, just load the current profile (requires token already present).
   */
  useEffect(() => {
    (async () => {
      try {
        setLoadingMe(true);

        // If credentials were passed and we haven't attempted this flow yet,
        // create the account and sign in.
        if (
          !didAttemptSignup &&
          signupUsername &&
          signupEmail &&
          signupPassword
        ) {
          setDidAttemptSignup(true);
          try {
            const { token, user: created } = await apiSignup({
              username: signupUsername.trim(),
              email: signupEmail.trim(),
              password: signupPassword,
            });
            await storeToken(token);
            if (created) {
              await writeProfileCache(created);
              setUser((prev: any) => ({
                ...prev,
                username: created.username ?? signupUsername.trim(),
                fullName: created.fullName ?? "",
                email: created.email ?? signupEmail.trim(),
                dob: created.dob ? String(created.dob).slice(0, 10) : "",
                gender: created.gender ?? "prefer_not_to_say",
                ethnicity: created.ethnicity ?? "not_specified",
                followUpFrequency: created.followUpFrequency ?? "daily",
                notifications: Boolean(created.notificationsEnabled ?? true),
                avatarUri: created.avatarUri ?? undefined,
              }));
              setLoadingMe(false);
              return;
            }
          } catch (e: any) {
            // If signup fails (e.g., already exists), fall through to try fetching profile.
            console.warn("Signup (non-fatal):", e?.message || e);
          }
        }

        // Load profile if token exists (or signup just happened)
        try {
          const { user: u } = await apiGetMe();
          if (u) {
            setUser((prev: any) => ({
              ...prev,
              username: u.username ?? "",
              fullName: u.fullName ?? "",
              email: u.email ?? (signupEmail || ""),
              dob: u.dob ? String(u.dob).slice(0, 10) : "",
              gender: u.gender ?? "prefer_not_to_say",
              ethnicity: u.ethnicity ?? "not_specified",
              followUpFrequency: u.followUpFrequency ?? "daily",
              notifications: Boolean(u.notificationsEnabled ?? true),
              avatarUri: u.avatarUri ?? undefined,
            }));
            setLoadingMe(false);
            return;
          }
        } catch {
          // Not signed in yet; if we still have email from params, prefill it.
          setUser((prev: any) => ({
            ...prev,
            email: signupEmail || "",
            username: signupUsername || "",
          }));
        }
      } finally {
        setLoadingMe(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupUsername, signupEmail, signupPassword, didAttemptSignup]);

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

  const onFinish = useCallback(async () => {
    try {
      setSubmitting(true);

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

      try {
        await apiUpsertFitnessProfile({
          goal: fitness.goal || "general_health",
          activityLevel: fitness.activityLevel || "moderate",
          experienceLevel: fitness.experienceLevel || null,
          daysPerWeek: fitness.daysPerWeek
            ? parseInt(fitness.daysPerWeek, 10)
            : null,
          sessionLengthMin: fitness.sessionLengthMin
            ? parseInt(fitness.sessionLengthMin, 10)
            : null,
          trainingLocation: fitness.trainingLocation || null,
          equipmentAvailable: fitness.equipmentAvailable || null,
          preferredActivities: fitness.preferredActivities || null,
          injuriesOrLimitations: fitness.injuriesOrLimitations || null,
          coachingStyle: fitness.coachingStyle || null,
          heightCm: fitness.heightCm ? parseInt(fitness.heightCm, 10) : null,
          weightKg: fitness.weightKg ? parseInt(fitness.weightKg, 10) : null,
        });
      } catch (e) {
        console.warn("fitness upsert (non-fatal):", e);
      }

      try {
        const macros =
          nutrition.macrosProtein ||
          nutrition.macrosCarbs ||
          nutrition.macrosFat
            ? {
                protein_g: nutrition.macrosProtein
                  ? parseInt(nutrition.macrosProtein, 10)
                  : undefined,
                carbs_g: nutrition.macrosCarbs
                  ? parseInt(nutrition.macrosCarbs, 10)
                  : undefined,
                fat_g: nutrition.macrosFat
                  ? parseInt(nutrition.macrosFat, 10)
                  : undefined,
              }
            : null;

        await apiUpsertNutritionProfile({
          dailyCalorieTarget: nutrition.dailyCalorieTarget
            ? parseInt(nutrition.dailyCalorieTarget, 10)
            : null,
          macros,
          prefCuisines: nutrition.prefCuisines || null,
          dietRestrictions: nutrition.dietRestrictions || null,
          dislikedFoods: nutrition.dislikedFoods || null,
          allergies: nutrition.allergies || null,
        });
      } catch (e) {
        console.warn("nutrition upsert (non-fatal):", e);
      }

      try {
        const { user: fresh } = await apiGetMe();
        if (fresh) await writeProfileCache(fresh);
      } catch {}

      router.replace("/(tabs)/homepage");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [user, fitness, nutrition]);

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
              onPress={goNext}
              className="rounded-xl p-3 my-8 bg-green-600">
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
              onPress={goNext}
              className="rounded-xl p-3 my-8 bg-green-600">
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
            submitLabel={submitting ? "Completing..." : "Complete onboarding"}
          />
        )}
      </ScrollView>
    </View>
  );
}
