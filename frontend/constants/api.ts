// frontend/constants/api.ts
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------------------- BASE URL -------------------- */
const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function getExpoHost(): string | null {
  const cfg: any = (Constants as any).expoConfig ?? {};
  const manifest: any =
    (Constants as any).manifest ??
    (Constants as any).manifest2?.extra?.expoClient ??
    {};
  const hostUri: string | undefined =
    cfg.hostUri || manifest.hostUri || cfg.developer?.host;
  if (!hostUri) return null;
  const noProto = hostUri.replace(/^https?:\/\//, "");
  const host = noProto.split(":")[0].trim();
  return host || null;
}

function makeUrlFromHost(host: string) {
  return `http://${host}:4000`;
}

function getAutoBaseUrl(): string | null {
  const host = getExpoHost();
  if (!host) return null;

  if (Platform.OS === "android") {
    if (host === "localhost" || host === "127.0.0.1")
      return "http://10.0.2.2:4000";
    return makeUrlFromHost(host);
  }
  if (host === "localhost" || host === "127.0.0.1")
    return "http://localhost:4000";
  return makeUrlFromHost(host);
}

export const BASE_URL =
  envUrl ||
  getAutoBaseUrl() ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000"
    : "http://localhost:4000");

/* -------------------- KEYS -------------------- */
export const K_TOKEN = "fu_token";
export const K_PROFILE = "fu_profile";

/* -------------------- ENDPOINTS -------------------- */
const EP = {
  // auth + user
  register: "/api/users/register",
  login: "/api/users/login",
  meGet: "/api/users/profile",
  mePut: "/api/users/profile",
  stats: "/api/users/stats",
  resetRequest: "/api/users/reset/request",
  resetConfirm: "/api/users/reset/confirm",
  checkUsername: "/api/users/check-username",
  checkEmail: "/api/users/check-email",

  // ExerciseDB proxy
  exercises: "/api/exercises",
  exerciseDetail: "/api/exercises",
  exerciseImage: (id: string | number, res = "180") =>
    `/api/exercises/${id}/image?resolution=${encodeURIComponent(res)}`,

  // Fitness plans
  plansRoot: "/api/fitness/plans",
  planOne: (id: string | number) => `/api/fitness/plans/${id}`,
  planExercises: (planId: string | number) =>
    `/api/fitness/plans/${planId}/exercises`,

  // Nutrition / Schedule
  nutritionProfile: "/api/nutrition/profile",
  schedulesRoot: "/api/schedule",
  events: "/api/schedule/events",
  eventsAutoPlan: "/api/schedule/auto-plan",
};

/* -------------------- helpers -------------------- */
class ApiError extends Error {
  status: number;
  payload?: any;
  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

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
    if (res.status === 401) await clearToken();
    throw new ApiError(
      (data as any)?.error || (data as any)?.message || `HTTP ${res.status}`,
      res.status,
      data
    );
  }
  return data as T;
}

/* -------------------- auth & user profile -------------------- */
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

/* -------------------- ExerciseDB proxy calls -------------------- */
export async function apiSearchExercises(params?: {
  q?: string;
  target?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q.toLowerCase());
  if (params?.target) qs.set("target", params.target.toLowerCase());
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.offset === "number")
    qs.set("offset", String(params.offset));
  const url = `${BASE_URL}${EP.exercises}${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{ items: any[]; pagination?: any }>(res);
}
export async function apiGetExerciseDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}${EP.exerciseDetail}/${id}`, {
    headers: await authHeaders(),
  });
  return asJson<{ item: any }>(res);
}
export function getExerciseImageUri(id: string | number, res = "180") {
  return `${BASE_URL}${EP.exerciseImage(id, res)}`;
}

/* -------------------- Fitness plan APIs -------------------- */
export async function apiListPlans() {
  const res = await fetch(`${BASE_URL}${EP.plansRoot}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; plans: any[]; pagination?: any }>(res);
}

// payload trimmed to fields that actually exist on the table now
export async function apiCreatePlan(payload: {
  name: string;
  status?: "active" | "draft" | "archived";
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.plansRoot}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; plan: any }>(res);
}

export async function apiUpdatePlan(
  id: string | number,
  patch: Partial<{
    name: string;
    status: "active" | "draft" | "archived";
    notes: string | null;
  }>
) {
  const res = await fetch(`${BASE_URL}${EP.planOne(id)}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(patch),
  });
  return asJson<{ success: boolean; plan: any }>(res);
}

export async function apiDeletePlan(id: string | number) {
  const res = await fetch(`${BASE_URL}${EP.planOne(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean }>(res);
}

export async function apiListPlanExercises(planId: string | number) {
  const res = await fetch(`${BASE_URL}${EP.planExercises(planId)}`, {
    headers: await authHeaders(),
  });
  // backend may return {items:[...]} or {exercises:[...]} — normalize here
  const json = await asJson<any>(res);
  const items = Array.isArray(json?.items)
    ? json.items
    : Array.isArray(json?.exercises)
    ? json.exercises
    : [];
  return { success: true, items };
}

export async function apiAddExerciseToPlan(
  planId: string | number,
  externalId: string | number,
  name: string,
  meta?: {
    gifUrl?: string | null;
    bodyPart?: string | null;
    target?: string | null;
    equipment?: string | null;
  }
) {
  const res = await fetch(`${BASE_URL}${EP.planExercises(planId)}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      externalId: String(externalId),
      name,
      ...(meta || {}),
    }),
  });
  return asJson<{ success: boolean; item: any }>(res);
}

export async function apiRemoveExerciseFromPlan(
  planId: string | number,
  itemId: string | number
) {
  const res = await fetch(`${BASE_URL}${EP.planExercises(planId)}/${itemId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean }>(res);
}

/* -------------------- nutrition + schedule -------------------- */
export async function apiGetNutritionProfile() {
  const res = await fetch(`${BASE_URL}${EP.nutritionProfile}`, {
    headers: await authHeaders(),
  });
  return asJson<{ profile: any | null }>(res);
}
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
  return asJson<{ success: boolean; events: any[] }>(res);
}

// MISSING BEFORE — now added:
export async function apiCreateEvent(payload: {
  category: "meal" | "workout" | "work" | "other";
  title: string;
  start_at: string; // ISO
  end_at?: string | null; // ISO or null
  notes?: string | null;
  recurrence_rule?: "none" | "daily" | "weekly" | "weekday";
  recurrence_until?: string | null; // ISO or null
}) {
  const res = await fetch(`${BASE_URL}${EP.events}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; event: any }>(res);
}

export async function apiUpdateEvent(
  id: number | string,
  patch: Partial<{
    category: "meal" | "workout" | "work" | "other";
    title: string;
    start_at: string;
    end_at: string | null;
    notes: string | null;
  }>
) {
  const res = await fetch(`${BASE_URL}${EP.events}/${id}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(patch),
  });
  return asJson<{ success: boolean; event: any }>(res);
}

export async function apiDeleteEvent(id: number | string) {
  const res = await fetch(`${BASE_URL}${EP.events}/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean }>(res);
}

// Suggest workouts into free slots; defaults to 7 days if not provided
export async function apiAutoPlanWorkouts(days = 7) {
  const res = await fetch(`${BASE_URL}${EP.eventsAutoPlan}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ days }),
  });
  return asJson<{ success: boolean; created_count: number }>(res);
}

/* -------------------- profile cache helpers -------------------- */
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
      createdAt: userObj?.createdAt,
      updatedAt: userObj?.updatedAt,
    };
    await AsyncStorage.setItem(K_PROFILE, JSON.stringify(slim));
  } catch {}
}
