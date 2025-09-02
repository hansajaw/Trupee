// Mobile/lib/api.js
export const API_URL = "https://trupee-production.up.railway.app"; // one source of truth

async function handle(r) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`);
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
  const r = await fetch(`${API_URL}/api/auth/resend`, {   // correct route
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
