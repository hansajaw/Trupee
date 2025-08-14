export const API_URL = "http://172.20.10.6:3000";

async function parseJSON(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { message: text }; }
}

export async function registerRequest({ email, userName, password }) {
  const r = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, userName, password }),
  });
  const data = await parseJSON(r);
  if (!r.ok) throw new Error(data?.message || `Error ${r.status}`);
  return data;
}

export async function resendVerification({ email }) {
  const r = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await parseJSON(r);
  if (!r.ok) throw new Error(data?.message || `Error ${r.status}`);
  return data;
}
