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

  // Fitness plans (exercise)
  plansRoot: "/api/fitness/plans",
  planOne: (id: string | number) => `/api/fitness/plans/${id}`,
  planExercises: (planId: string | number) =>
    `/api/fitness/plans/${planId}/exercises`,

  // Profiles
  nutritionProfile: "/api/nutrition/profile",
  fitnessProfile: "/api/fitness/profile",

  // Schedule
  schedulesRoot: "/api/schedule",
  events: "/api/schedule/events",
  eventsAutoPlan: "/api/schedule/auto-plan",

  // Motivational Quotes
  quotesDaily: "/api/quotes/daily",
  quotesRandom: "/api/quotes/random",
  quotesAll: "/api/quotes",

  // ---------- Step Tracking (Streak) ----------
  stepsUpsert: "/api/steps",
  stepsGetByDate: (date: string) => `/api/steps/${date}`,
  stepsRange: "/api/steps/range",
  stepsStats: "/api/steps/stats",
  stepsWeekly: "/api/steps/weekly",
  stepsMonthly: "/api/steps/monthly",
  stepsStreak: "/api/steps/streak",
  stepsChart: "/api/steps/chart",
  stepsDelete: (date: string) => `/api/steps/${date}`,

  // ---------- Catalog + Meal Planner ----------
  foodsSearch: "/api/foods/search",
  foodDetail: (id: string | number) => `/api/foods/${id}`,

  // FatSecret recipes
  recipesSearch: "/api/recipes/search", // v3 under the hood
  recipeDetail: (id: string | number) => `/api/recipes/${id}`, // v2 detail
  recipeSave: "/api/recipes/save",

  // Meal plans (nutrition)
  mealPlans: "/api/plans", // GET (list) + POST (create)
  mealPlanAdd: "/api/plans/add",
  mealPlanSummary: (id: string | number) => `/api/plans/${id}/summary`,

  // Meal logging
  mealsLog: "/api/meals/log",
  mealsGet: "/api/meals",
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
  } as Record<string, string>;
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

/* -------- username & email availability checks -------- */
export async function apiCheckUsername(username: string) {
  const qs = new URLSearchParams({ username: username.trim() });
  const res = await fetch(`${BASE_URL}${EP.checkUsername}?${qs.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return asJson<{ available: boolean }>(res);
}

export async function apiCheckEmail(email: string) {
  const qs = new URLSearchParams({ email: email.trim().toLowerCase() });
  const res = await fetch(`${BASE_URL}${EP.checkEmail}?${qs.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return asJson<{ available: boolean }>(res);
}

/* -------------------- password reset -------------------- */
export async function apiResetRequest(email: string) {
  const res = await fetch(`${BASE_URL}${EP.resetRequest}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return asJson<{ success: boolean; message?: string }>(res);
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
  return asJson<{ success: boolean; message?: string }>(res);
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

export async function apiGetFitnessProfile() {
  const res = await fetch(`${BASE_URL}${EP.fitnessProfile}`, {
    headers: await authHeaders(),
  });
  return asJson<{ profile: any | null }>(res);
}
export async function apiListPlans() {
  const res = await fetch(`${BASE_URL}${EP.plansRoot}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; plans: any[]; pagination?: any }>(res);
}
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

/* -------------------- nutrition + fitness profiles -------------------- */
export async function apiGetNutritionProfile() {
  const res = await fetch(`${BASE_URL}${EP.nutritionProfile}`, {
    headers: await authHeaders(),
  });
  return asJson<{ profile: any | null }>(res);
}
export async function apiUpsertNutritionProfile(payload: {
  dailyCalorieTarget?: number | null;
  macros?: {
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  } | null;
  prefCuisines?: string | null;
  dietRestrictions?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.nutritionProfile}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; profile: any }>(res);
}
export async function apiUpsertFitnessProfile(payload: {
  goal?: string | null;
  activityLevel?: string | null;
  daysPerWeek?: number | null;
  injuriesOrLimitations?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.fitnessProfile}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ success: boolean; profile: any }>(res);
}

/* -------------------- schedule + events -------------------- */
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
export async function apiCreateEvent(payload: {
  category: "meal" | "workout" | "work" | "other";
  title: string;
  start_at: string; // ISO
  end_at?: string | null;
  notes?: string | null;
  recurrence_rule?: "none" | "daily" | "weekly" | "weekday";
  recurrence_until?: string | null;
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

/* -------------------- motivational quotes -------------------- */
const K_QUOTE_CACHE = "fu_quote_cache";
export async function apiGetQuoteOfTheDay() {
  const res = await fetch(`${BASE_URL}${EP.quotesDaily}`);
  return asJson(res);
}
export async function apiGetRandomQuote(category?: string) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${BASE_URL}${EP.quotesRandom}${qs}`);
  return asJson(res);
}
export async function readQuoteCache(): Promise<{
  quote: any;
  timestamp: number;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(K_QUOTE_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export async function writeQuoteCache(quote: any) {
  try {
    const data = { quote, timestamp: Date.now() };
    await AsyncStorage.setItem(K_QUOTE_CACHE, JSON.stringify(data));
  } catch {}
}
export async function clearQuoteCache() {
  try {
    await AsyncStorage.removeItem(K_QUOTE_CACHE);
  } catch {}
}

/* -------------------- Catalog + Meal Planner (FatSecret) -------------------- */

// (1) Optional foods endpoints (not used in the new UI, but kept)
export async function apiSearchFoods(q: string, page = 0) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (page) qs.set("page", String(page));
  const res = await fetch(`${BASE_URL}${EP.foodsSearch}?${qs}`);
  return asJson<any>(res);
}

// (2) Recipes search v3 (THIS is what Meal tab uses)
export async function apiSearchRecipesV3(params: {
  q?: string;
  page?: number; // 0-based
  maxResults?: number; // default 25
  recipeTypesCsv?: string; // "breakfast,baked" (optional)
  matchAll?: boolean; // optional
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  qs.set("page", String(params?.page ?? 0));
  qs.set("max_results", String(params?.maxResults ?? 25));
  if (params?.recipeTypesCsv) qs.set("recipe_types", params.recipeTypesCsv);
  if (typeof params?.matchAll === "boolean")
    qs.set("recipe_types_matchall", params.matchAll ? "true" : "false");

  const res = await fetch(`${BASE_URL}${EP.recipesSearch}?${qs.toString()}`);
  return asJson<any>(res); // FatSecret v3 passthrough
}

// (3) Recipe detail (v2)
export async function apiGetRecipeDetail(id: string | number) {
  const res = await fetch(`${BASE_URL}${EP.recipeDetail(id)}`);
  return asJson<any>(res);
}

// (4) Persist a recipe in our DB to use in meal plans
export async function apiSaveRecipe(recipe_id: string | number) {
  const res = await fetch(`${BASE_URL}${EP.recipeSave}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ recipe_id: String(recipe_id) }),
  });
  return asJson<{ ok: boolean; recipe: any }>(res);
}

// (5) Meal planner list/create/add/summary
export async function apiListMealPlans() {
  const res = await fetch(`${BASE_URL}${EP.mealPlans}`, {
    headers: await authHeaders(),
  });
  return asJson<{ plans: any[] }>(res);
}
export async function apiCreateMealPlan(name: string) {
  const res = await fetch(`${BASE_URL}${EP.mealPlans}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ name }),
  });
  return asJson<any>(res);
}
export async function apiAddMealToPlan(opts: {
  meal_plan_id: number;
  recipe_id: number;
  servings?: number;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  scheduled_at?: string | null;
  notes?: string | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.mealPlanAdd}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(opts),
  });
  return asJson<{ added: any; summary: any }>(res);
}
export async function apiGetMealPlanSummary(planId: number) {
  const res = await fetch(`${BASE_URL}${EP.mealPlanSummary(planId)}`, {
    headers: await authHeaders(),
  });
  return asJson<any>(res);
}


// (6) Log meals
export async function apiLogMeal(opts: {
  name: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  serving_size?: number;
  serving_unit?: string;
  notes?: string;
  meal_plan_id?: number;
  logged_at?: string;
}) {
  const res = await fetch(`${BASE_URL}${EP.mealsLog}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(opts),
  });
  return asJson<{ ok: boolean; meal: any }>(res);
}

export async function apiGetUserMeals(opts?: {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}) {
  const params = new URLSearchParams();
  if (opts?.limit) params.append("limit", String(opts.limit));
  if (opts?.offset) params.append("offset", String(opts.offset));
  if (opts?.start_date) params.append("start_date", opts.start_date);
  if (opts?.end_date) params.append("end_date", opts.end_date);

  const res = await fetch(`${BASE_URL}${EP.mealsGet}?${params}`, {
    headers: await authHeaders(),
  });
  return asJson<{ ok: boolean; meals: any[]; total: number }>(res);
}

/* -------------------- Step Tracking -------------------- */

export interface StepRecord {
  id: number;
  userId: number;
  date: string;
  stepCount: number;
  calories?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepStats {
  totalDays: number;
  totalSteps: number;
  avgSteps: number;
  maxSteps: number;
  minSteps: number;
  totalCalories: number;
  avgCalories: number;
}

export interface WeeklyStepStats {
  weekStart: string;
  daysLogged: number;
  totalSteps: number;
  avgSteps: number;
  maxSteps: number;
  totalCalories: number;
}

export interface MonthlyStepStats {
  monthStart: string;
  daysLogged: number;
  totalSteps: number;
  avgSteps: number;
  maxSteps: number;
  totalCalories: number;
}

// Upsert step data for a specific date
export async function apiUpsertSteps(data: {
  date: string; // YYYY-MM-DD
  stepCount: number;
  calories?: number;
}) {
  const res = await fetch(`${BASE_URL}${EP.stepsUpsert}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return asJson<{ success: boolean; stepRecord: StepRecord }>(res);
}

// Get steps for a specific date
export async function apiGetStepsByDate(date: string) {
  const res = await fetch(`${BASE_URL}${EP.stepsGetByDate(date)}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; stepRecord: StepRecord }>(res);
}

// Get steps for a date range
export async function apiGetStepsRange(start: string, end: string) {
  const qs = new URLSearchParams({ start, end });
  const res = await fetch(`${BASE_URL}${EP.stepsRange}?${qs.toString()}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; count: number; stepRecords: StepRecord[] }>(res);
}

// Get statistics for a period
export async function apiGetStepsStats(
  start: string,
  end: string,
  period: "overall" | "week" | "month" = "overall"
) {
  const qs = new URLSearchParams({ start, end, period });
  const res = await fetch(`${BASE_URL}${EP.stepsStats}?${qs.toString()}`, {
    headers: await authHeaders(),
  });
  return asJson<{ 
    success: boolean; 
    period: string;
    dateRange: { start: string; end: string };
    stats: StepStats | WeeklyStepStats[] | MonthlyStepStats[];
  }>(res);
}

// Get weekly aggregated stats
export async function apiGetWeeklyStepsStats(start: string, end: string) {
  const qs = new URLSearchParams({ start, end });
  const res = await fetch(`${BASE_URL}${EP.stepsWeekly}?${qs.toString()}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; count: number; weeklyStats: WeeklyStepStats[] }>(res);
}

// Get monthly aggregated stats
export async function apiGetMonthlyStepsStats(start: string, end: string) {
  const qs = new URLSearchParams({ start, end });
  const res = await fetch(`${BASE_URL}${EP.stepsMonthly}?${qs.toString()}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; count: number; monthlyStats: MonthlyStepStats[] }>(res);
}

// Get current streak
export async function apiGetStepsStreak() {
  const res = await fetch(`${BASE_URL}${EP.stepsStreak}`, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; streakDays: number; message: string }>(res);
}

// Get chart-ready data
export async function apiGetStepsChart(start: string, end: string) {
  const qs = new URLSearchParams({ start, end });
  const res = await fetch(`${BASE_URL}${EP.stepsChart}?${qs.toString()}`, {
    headers: await authHeaders(),
  });
  return asJson<{
    success: boolean;
    dateRange: { start: string; end: string };
    dailyData: StepRecord[];
    overallStats: StepStats;
    chartReady: boolean;
  }>(res);
}

// Delete steps for a specific date
export async function apiDeleteSteps(date: string) {
  const res = await fetch(`${BASE_URL}${EP.stepsDelete(date)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; message: string }>(res);

}
