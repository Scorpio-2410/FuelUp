import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://localhost:4000";

// small things in SecureStore (token); larger profile cache in AsyncStorage
export const K_TOKEN = "fu_token";
export const K_PROFILE = "fu_profile";

/** Endpoint map (aligned with backend controllers/routes) */
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

  // fitness (profile + plans + exercises)
  fitnessProfilesRoot: "/api/fitness/profile",
  fitnessPlans: "/api/fitness/plans",
  fitnessPlansCurrent: "/api/fitness/plans/current",
  fitnessPlansRecommend: "/api/fitness/plans/recommend",
  exercises: "/api/fitness/exercises",

  // nutrition
  nutritionProfile: "/api/nutrition/profile",

  // meals (+ plans)
  meals: "/api/meals",
  mealsDaily: "/api/meals/daily",
  mealPlans: "/api/meal-plans",
  mealPlansCurrent: "/api/meal-plans/current",
  mealPlansRecommend: "/api/meal-plans/recommend",

  // --- schedule endpoints ---
  schedulesRoot: "/api/schedule",
  events: "/api/schedule/events",
  suggest: "/api/schedule/suggest",
  autoPlan: "/api/schedule/auto-plan",
};

function asJson<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    return res
      .json()
      .catch(() => ({}))
      .then((j) => {
        throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
      });
  }
  return res.json();
}

async function authHeaders() {
  const token = await SecureStore.getItemAsync(K_TOKEN);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ---------------- token ---------------- */
export async function storeToken(token: string) {
  await SecureStore.setItemAsync(K_TOKEN, token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(K_TOKEN);
  await AsyncStorage.removeItem(K_PROFILE);
}

/* -------------- profile cache (AsyncStorage) -------------- */
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

/* ---------------- fitness (profile + plans + exercises) ---------------- */
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
// Get exercises with pagination and filtering
export async function apiGetExercises(params?: {
  limit?: number;
  offset?: number;
  muscleGroup?: string;
}) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());
  if (params?.muscleGroup) query.set('muscleGroup', params.muscleGroup);
  
  const url = `${BASE_URL}${EP.exercises}${query.toString() ? '?' + query.toString() : ''}`;
  const res = await fetch(url, {
    headers: await authHeaders(),
  });
  return asJson<{ success: boolean; exercises: any[]; pagination: any }>(res);
}

// Get specific exercise by ID
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

/* ---------------- nutrition (merged profile) ---------------- */
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

/* ---------------- meals + meal plans ---------------- */
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
  /** Now supports 'weekday' too */
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
    /** Now supports 'weekday' too */
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

/* ---------- trigger backend auto-planning of workouts ---------- */
export async function apiAutoPlanWorkouts(horizonDays: number = 7) {
  const res = await fetch(`${BASE_URL}${EP.autoPlan}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ horizonDays }),
  });
  return asJson<{ success: boolean; created_count: number; events: any[] }>(
    res
  );
}
