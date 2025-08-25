// Simple in-memory store for demo. Replace with your real DB/User model.
const users = new Map(); // email -> { email, name, verified }

export function upsertUser({ email, name }) {
  const u = users.get(email) || { email, name, verified: false };
  u.name = name ?? u.name;
  users.set(email, u);
  return u;
}

export function markVerified(email) {
  const u = users.get(email);
  if (u) u.verified = true;
  return u;
}

export function getUser(email) {
  return users.get(email);
}
