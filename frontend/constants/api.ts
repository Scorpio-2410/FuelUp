// constants/api.ts
import * as SecureStore from "expo-secure-store";

export const BASE_URL = "http://localhost:4000";
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
  checkUsername: "/api/users/check-username", // NEW
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

// --- auth token helpers ---
export async function storeToken(token: string) {
  await SecureStore.setItemAsync(K_TOKEN, token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(K_TOKEN);
  // also clear cached profile so the tab doesn’t hydrate with stale/empty data
  await SecureStore.deleteItemAsync(K_PROFILE);
}

// --- profile cache helpers (optional but handy) ---
export async function readProfileCache(): Promise<any | null> {
  const raw = await SecureStore.getItemAsync(K_PROFILE);
  return raw ? JSON.parse(raw) : null;
}
export async function writeProfileCache(userObj: any) {
  await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(userObj));
}

// --- Auth ---
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

// --- Username availability (public) ---
export async function apiCheckUsername(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  const url = `${BASE_URL}${EP.checkUsername}?username=${encodeURIComponent(
    username
  )}`;
  const res = await fetch(url, { method: "GET" });
  return asJson<{ available: boolean; reason?: string }>(res);
}

// --- Profile ---
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

// --- Stats ---
export async function apiGetStats() {
  const res = await fetch(`${BASE_URL}${EP.stats}`, {
    headers: await authHeaders(),
  });
  return asJson<{ stats: any }>(res);
}

// --- Password reset ---
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
