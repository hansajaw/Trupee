// Mobile/lib/api.js
import Constants from "expo-constants";

// ✅ Unified backend URL (Vercel)
export const API_URL =
  Constants.expoConfig?.extra?.API_URL || "https://trupee.vercel.app";

async function handle(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
  return data;
}

export async function register({ email, userName, fullName, password }) {
  const r = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, userName, fullName, password }),
  });
  return handle(r);
}

export async function resendVerification({ email }) {
  const r = await fetch(`${API_URL}/api/auth/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handle(r);
}

export async function login({ emailOrUserName, password }) {
  const r = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUserName, password }),
  });
  return handle(r);
}
