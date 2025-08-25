import jwt from "jsonwebtoken";

const TTL_MIN = Number(process.env.JWT_TTL_MINUTES || 30);

export function generateVerificationToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${TTL_MIN}m` });
}

export function verifyToken(token) {
  try {
    return { ok: true, data: jwt.verify(token, process.env.JWT_SECRET) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
