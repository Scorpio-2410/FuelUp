// frontend/constants/api.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * ------- Dynamic BASE URL detection (works on any network) -------
 * Priority:
 *   1) EXPO_PUBLIC_API_URL (if you want to force a URL)
 *   2) Derive from Expo host/packager (physical device picks LAN IP automatically)
 *   3) Platform-safe fallbacks (10.0.2.2 for Android emulator, localhost for iOS sim)
 *
 * This lets you walk into any Wi-Fi, start Expo + backend, and the app
 * will talk to your machine without hard-coding IPs.
 */

// Optional env override (no code change needed to use it)
const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

/** Try to read the dev server host/ip from Expo metadata */
function getExpoHost(): string | null {
  // Try multiple places; different Expo versions surface different fields
  // Examples of hostUri: "192.168.1.23:19000", "localhost:19000"
  const cfg: any = (Constants as any).expoConfig ?? {};
  const manifest: any =
    (Constants as any).manifest ??
    (Constants as any).manifest2?.extra?.expoClient ??
    {};
  const hostUri: string | undefined =
    cfg.hostUri || manifest.hostUri || cfg.developer?.host || undefined;

  if (!hostUri) return null;
  // strip any protocol and port, keep only hostname/ip
  const noProto = hostUri.replace(/^https?:\/\//, "");
  const host = noProto.split(":")[0].trim();
  return host || null;
}

function makeUrlFromHost(host: string): string {
  // If it already looks like an IP/host, just use it on port 4000
  return `http://${host}:4000`;
}

function getAutoBaseUrl(): string | null {
  const host = getExpoHost();
  if (!host) return null;

  // Android emulator special case: localhost of device != host machine
  if (Platform.OS === "android") {
    // If the debug host is localhost (i.e., iOS sim/metro on same machine),
    // Android emulator will need 10.0.2.2 to reach the host.
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://10.0.2.2:4000";
    }
    // Physical Android device on LAN → use the LAN host directly
    return makeUrlFromHost(host);
  }

  if (Platform.OS === "ios") {
    // iOS simulator can hit localhost; physical device needs the LAN host
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
    return makeUrlFromHost(host);
  }

  // Other platforms: best effort
  return makeUrlFromHost(host);
}

/** Final BASE_URL resolution */
export const BASE_URL =
  envUrl ||
  getAutoBaseUrl() ||
  // Last-resort fallbacks if Expo metadata is unavailable
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000"
    : "http://localhost:4000");

/** Small key/value store constants */
export const K_TOKEN = "fu_token";
export const K_PROFILE = "fu_profile";

/** Endpoint map — aligned with your backend routes */
const EP = {
  // users
  register: "/api/users/register",
  login: "/api/users/login",
  meGet: "/api/users/profile",
  mePut: "/api/users/profile",
  stats: "/api/users/stats",
  resetRequest: "/api/users/reset/request",
  resetConfirm: "/api/users/reset/confirm",
  checkUsername: "/api/users/check-username",
  checkEmail: "/api/users/check-email",

  // fitness
  fitnessProfilesRoot: "/api/fitness/profile",
  fitnessPlans: "/api/fitness/plans",
  fitnessPlansCurrent: "/api/fitness/plans/current",
  fitnessPlansRecommend: "/api/fitness/plans/recommend",
  exercises: "/api/fitness/exercises",
  exerciseCategories: "/api/fitness/categories",

  // nutrition
  nutritionProfile: "/api/nutrition/profile",

  // meals (+ daily + plans) — FIXED to match backend
  meals: "/api/meals",
  mealsDaily: "/api/meals/daily",
  mealPlans: "/api/meals/plans",
  mealPlansCurrent: "/api/meals/plans/current",
  mealPlansRecommend: "/api/meals/plans/recommend",

  // schedule
  schedulesRoot: "/api/schedule",
  events: "/api/schedule/events",
  // Uncomment if implemented on backend:
  // suggest: "/api/schedule/suggest",
  // autoPlan: "/api/schedule/auto-plan",
};

class ApiError extends Error {
  status: number;
  payload?: any;
  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- token helpers ---------------- */
export async function storeToken(token: string) {
  await SecureStore.setItemAsync(K_TOKEN, token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(K_TOKEN);
  await AsyncStorage.removeItem(K_PROFILE);
}
async function authHeaders() {
  const token = await SecureStore.getItemAsync(K_TOKEN);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ---------------- fetch helpers ---------------- */
function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
async function asJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? safeJson(text) : {};
  if (!res.ok) {
    if (res.status === 401) {
      await clearToken();
    }
    throw new ApiError(
      (data as any)?.error || (data as any)?.message || `HTTP ${res.status}`,
      res.status,
      data
    );
  }
  return data as T;
}

/* ---------------- auth ---------------- */
export async function apiSignup(payload: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${BASE_URL}${EP.register}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return asJson<{ token: string; user: any }>(res);
}
export async function apiLogin(payload: {
  identifier: string;
  password: string;
}) {
  const res = await fetch(`${BASE_URL}${EP.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return asJson<{ token: string; user: any }>(res);
}
export async function apiCheckUsername(username: string) {
  const res = await fetch(
    `${BASE_URL}${EP.checkUsername}?username=${encodeURIComponent(username)}`
  );
  return asJson<{ available: boolean; reason?: string }>(res);
}
export async function apiCheckEmail(email: string) {
  const res = await fetch(
    `${BASE_URL}${EP.checkEmail}?email=${encodeURIComponent(email)}`
  );
  return asJson<{ available: boolean; reason?: string }>(res);
}

/* -------- password reset (public) -------- */
export async function apiResetRequest(email: string) {
  const res = await fetch(`${BASE_URL}${EP.resetRequest}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return asJson<{ ok: true }>(res);
}
export async function apiResetConfirm(payload: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const res = await fetch(`${BASE_URL}${EP.resetConfirm}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return asJson<{ ok: true }>(res);
}

/* ---------------- user profile ---------------- */
export async function apiGetMe() {
  const res = await fetch(`${BASE_URL}${EP.meGet}`, {
    headers: await authHeaders(),
  });
  return asJson<{ user: any }>(res);
}
export async function apiUpdateMe(partial: Record<string, any>) {
  const res = await fetch(`${BASE_URL}${EP.mePut}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(partial),
  });
  return asJson<{ user: any; message: string }>(res);
}
export async function apiGetStats() {
  const res = await fetch(`${BASE_URL}${EP.stats}`, {
    headers: await authHeaders(),
  });
  return asJson<{ stats: any }>(res);
}

/* ---------------- fitness ---------------- */
export async function apiGetFitnessProfile() {
  const res = await fetch(`${BASE_URL}${EP.fitnessProfilesRoot}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; profile: any | null }>(res);
}
export async function apiUpsertFitnessProfile(payload: {
  goal?: string | null;
  activityLevel?: string | null;
  experienceLevel?: string | null;
  daysPerWeek?: number | null;
  sessionLengthMin?: number | null;
  trainingLocation?: string | null;
  equipmentAvailable?: string[] | string | null;
  preferredActivities?: string[] | string | null;
  injuriesOrLimitations?: string | null;
  coachingStyle?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.fitnessProfilesRoot}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; profile: any }>(res);
}
export async function apiGetCurrentFitnessPlan() {
  const res = await fetch(`${BASE_URL}${EP.fitnessPlansCurrent}`, {
    headers: await authHeaders(),
  });
  return asJson<{ plan: any | null }>(res);
}
export async function apiCreateFitnessPlan(payload: {
  name: string;
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.fitnessPlans}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ plan: any }>(res);
}
export async function apiRecommendFitnessPlan() {
  const res = await fetch(`${BASE_URL}${EP.fitnessPlansRecommend}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return asJson<{ plan: any }>(res);
}

/* ---------------- exercises ---------------- */
export async function apiGetExercises(params?: {
  limit?: number;
  offset?: number;
  muscleGroup?: string;
  categoryId?: number;
}) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.muscleGroup) query.set("muscleGroup", params.muscleGroup);
  if (params?.categoryId) query.set("categoryId", params.categoryId.toString());
  const url = `${BASE_URL}${EP.exercises}${
    query.toString() ? "?" + query.toString() : ""
  }`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{ success: boolean; exercises: any[]; pagination: any }>(res);
}
export async function apiGetExerciseCategories(params?: {
  isGymExercise?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.isGymExercise !== undefined)
    query.set("isGymExercise", String(params.isGymExercise));
  const url = `${BASE_URL}${EP.exerciseCategories}${
    query.toString() ? "?" + query.toString() : ""
  }`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{ success: boolean; categories: any[] }>(res);
}
export async function apiGetExercise(id: number) {
  const res = await fetch(`${BASE_URL}${EP.exercises}/${id}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; exercise: any }>(res);
}
export async function apiCreateExercise(payload: {
  name: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  durationMin?: number | null;
  sets?: number | null;
  reps?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.exercises}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ exercise: any }>(res);
}

/* ---------------- nutrition ---------------- */
export async function apiGetNutritionProfile() {
  const res = await fetch(`${BASE_URL}${EP.nutritionProfile}`, {
    headers: await authHeaders(),
  });
  return asJson<{ profile: any | null }>(res);
}
export async function apiUpsertNutritionProfile(payload: {
  dailyCalorieTarget?: number | null;
  macros?: { protein_g?: number; carbs_g?: number; fat_g?: number } | null;
  prefCuisines?: string[] | string | null;
  dietRestrictions?: string[] | string | null;
  dislikedFoods?: string[] | string | null;
  allergies?: string[] | string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.nutritionProfile}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ profile: any }>(res);
}

/* ---------------- meals + daily + plans ---------------- */
export async function apiCreateMeal(payload: {
  name: string;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  notes?: string | null;
  logged_at?: string | null; // ISO timestamp
}) {
  const res = await fetch(`${BASE_URL}${EP.meals}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ meal: any }>(res);
}
export async function apiGetDailyMealsTotals(date: string) {
  const url = `${BASE_URL}${EP.mealsDaily}?date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{ date: string; totals: any }>(res);
}
export async function apiGetCurrentMealPlan() {
  const res = await fetch(`${BASE_URL}${EP.mealPlansCurrent}`, {
    headers: await authHeaders(),
  });
  return asJson<{ plan: any | null }>(res);
}
export async function apiCreateMealPlan(payload: {
  name: string;
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.mealPlans}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ plan: any }>(res);
}
export async function apiRecommendMealPlan() {
  const res = await fetch(`${BASE_URL}${EP.mealPlansRecommend}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return asJson<{ plan: any }>(res);
}

/* ---------------- schedule + events ---------------- */
export async function apiGetSchedule() {
  const res = await fetch(`${BASE_URL}${EP.schedulesRoot}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; schedule: any | null }>(res);
}
export async function apiListEvents(params?: { from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const url = `${BASE_URL}${EP.events}${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{
    success: boolean;
    events: Array<{
      id: number | string;
      db_id?: number;
      dbId?: number;
      schedule_id?: number;
      category: string;
      title: string;
      start_at?: string;
      end_at?: string | null;
      startAt?: string;
      endAt?: string | null;
      notes?: string | null;
    }>;
  }>(res);
}
export async function apiCreateEvent(payload: {
  category: "meal" | "workout" | "work" | "other";
  title: string;
  start_at: string; // ISO UTC
  end_at?: string | null; // ISO UTC
  notes?: string | null;
  recurrence_rule?: "none" | "daily" | "weekly" | "weekday";
  recurrence_until?: string | null; // ISO UTC
}) {
  const res = await fetch(`${BASE_URL}${EP.events}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; event: any }>(res);
}
export async function apiGetEvent(id: number) {
  const res = await fetch(`${BASE_URL}${EP.events}/${id}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; event: any }>(res);
}
export async function apiUpdateEvent(
  id: number,
  payload: {
    category?: "meal" | "workout" | "work" | "other";
    title?: string;
    start_at?: string; // ISO UTC
    end_at?: string | null; // ISO UTC
    notes?: string | null;
    recurrence_rule?: "none" | "daily" | "weekly" | "weekday";
    recurrence_until?: string | null; // ISO UTC
  }
) {
  const res = await fetch(`${BASE_URL}${EP.events}/${id}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; event: any }>(res);
}
export async function apiDeleteEvent(id: number) {
  const res = await fetch(`${BASE_URL}${EP.events}/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean }>(res);
}

/* -------------- profile cache -------------- */
export async function readProfileCache(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(K_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export async function writeProfileCache(userObj: any) {
  try {
    const slim = {
      id: userObj?.id,
      username: userObj?.username,
      email: userObj?.email,
      avatarUri: userObj?.avatarUri,
      dob: userObj?.dob,
      gender: userObj?.gender,
      notificationsEnabled: userObj?.notificationsEnabled,
      followUpFrequency: userObj?.followUpFrequency,
      ethnicity: userObj?.ethnicity,
      createdAt: userObj?.createdAt,
      updatedAt: userObj?.updatedAt,
    };
    await AsyncStorage.setItem(K_PROFILE, JSON.stringify(slim));
  } catch {
    // best-effort
  }
}
