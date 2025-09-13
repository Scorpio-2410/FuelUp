import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://localhost:4000";

// small things in SecureStore (token); larger profile cache in AsyncStorage
export const K_TOKEN = "fu_token";
export const K_PROFILE = "fu_profile";

const EP = {
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
  fitnessGet: "/api/fitness",
  fitnessUpsert: "/api/fitness",

  // nutrition targets
  nutritionGet: "/api/nutrition/targets",
  nutritionSet: "/api/nutrition/targets",
  nutritionDaily: "/api/nutrition/daily", // ?date=YYYY-MM-DD
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
    // cache is best-effort
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
export async function apiGetFitness() {
  const res = await fetch(`${BASE_URL}${EP.fitnessGet}`, {
    headers: await authHeaders(),
  });
  return asJson<{ fitness: any }>(res);
}

export async function apiUpsertFitness(payload: {
  goal: string;
  activityLevel: string;
  experienceLevel?: string;
  daysPerWeek?: number;
  sessionLengthMin?: number;
  trainingLocation?: string;
  equipmentAvailable?: string[];
  preferredActivities?: string[];
  injuriesOrLimitations?: string;
  coachingStyle?: string;
}) {
  const res = await fetch(`${BASE_URL}${EP.fitnessUpsert}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ fitness: any }>(res);
}

/* ---------------- nutrition targets ---------------- */
export async function apiGetNutritionTargets() {
  const res = await fetch(`${BASE_URL}${EP.nutritionGet}`, {
    headers: await authHeaders(),
  });
  return asJson<{ targets: any }>(res);
}

export async function apiSetNutritionTargets(payload: {
  dailyCalorieTarget?: number | null;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatTarget?: number | null;
  fiberTarget?: number | null;
  sodiumTarget?: number | null;
}) {
  const res = await fetch(`${BASE_URL}${EP.nutritionSet}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return asJson<{ targets: any }>(res);
}

export async function apiGetDailyNutrition(date: string) {
  const url = `${BASE_URL}${EP.nutritionDaily}?date=${encodeURIComponent(
    date
  )}`;
  const res = await fetch(url, { headers: await authHeaders() });
  return asJson<{ date: string; totals: any }>(res);
}

/* ---------------- password reset ---------------- */
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
