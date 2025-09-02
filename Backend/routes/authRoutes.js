// Backend/routes/authRoutes.js
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendMail } from "../lib/mailer.js";

const router = express.Router();

const API_URL = process.env.API_URL || "http://localhost:3000";
// Default to your own API host's /verify-success page
const POST_VERIFY_REDIRECT_URL =
  process.env.POST_VERIFY_REDIRECT_URL || `${API_URL}/verify-success`;

/* ------------------- utils ------------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

function buildVerificationEmail({ userName, verifyUrl }) {
  const subject = "Verify your Trupee email";
  const safeName = escapeHtml(userName || "there");
  const safeUrl = escapeHtml(String(verifyUrl || ""));
  const html = `<!doctype html>
<html>
  <body style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,0.06);">
      <tr><td style="padding:28px 28px 8px;">
        <h2 style="margin:0 0 12px;">Hi ${safeName} 👋</h2>
        <p style="margin:0;color:#444;">Thanks for signing up for <b>Trupee</b>. Please verify your email address:</p>
        <p style="margin:20px 0;">
          <a href="${safeUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Verify Email</a>
        </p>
        <p style="font-size:12px;color:#666;margin-top:22px;">
          If the button doesn’t work, copy and paste this link:<br>
          <span style="word-break:break-all;color:#1f2937;">${safeUrl}</span>
        </p>
      </td></tr>
    </table>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:14px;">You’re receiving this because someone used this email to sign up to Trupee.</p>
  </body>
</html>`;
  const text = `Hi ${userName || "there"},

Thanks for signing up for Trupee. Please verify your email:
${verifyUrl}

If you didn’t request this, you can ignore this email.`;
  return { subject, html, text };
}

/* ------------- verification issuing ------------- */
async function issueAndEmailVerification(user) {
  const rawToken = user.createEmailVerifyToken();
  await user.save();

  const verifyUrl = `${API_URL}/api/auth/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(
    user.email
  )}`;

  const { subject, html, text } = buildVerificationEmail({
    userName: user.fullName || user.userName || user.email.split("@")[0],
    verifyUrl,
  });

  if (process.env.SKIP_EMAIL === "true") {
    console.warn("SKIP_EMAIL=true — not sending verification email.");
    return { sent: false, error: "SKIP_EMAIL=true" };
  }

  try {
    await sendMail({ to: user.email, subject, html, text });
    return { sent: true };
  } catch (err) {
    console.error("sendMail failed:", err?.message || err);
    return { sent: false, error: err?.message || "sendMail failed" };
  }
}

/* ------------------- routes ------------------- */

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, userName, fullName, password } = req.body || {};
    if (!email || !userName || !password) {
      return res.status(400).json({ message: "userName, email and password are required" });
    }

    const e = String(email).toLowerCase().trim();
    const u = String(userName).toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (!/^[a-z0-9._-]{3,32}$/.test(u)) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    if (await User.findOne({ email: e })) return res.status(409).json({ message: "Email already in use" });
    if (await User.findOne({ userName: u })) return res.status(409).json({ message: "Username already in use" });

    const user = await User.create({ email: e, userName: u, fullName, password, isVerified: false });

    console.log("About to send verification:", { to: user.email, url: `${API_URL}/api/auth/verify?...` });
    const { sent, error } = await issueAndEmailVerification(user);
    return res.json({
      ok: true,
      message: sent ? "Verification email sent" : "User created; email not sent",
      ...(error ? { devNote: error } : {}),
    });
  } catch (err) {
    console.error("register error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/resend  (accepts emailOrUserName or email)
router.post("/resend", async (req, res) => {
  try {
    const { emailOrUserName, email } = req.body || {};
    const identifier = String(emailOrUserName ?? email ?? "").trim();
    if (!identifier) return res.status(400).json({ message: "email required" });

    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { userName: identifier.toLowerCase() };

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.json({ ok: true, message: "Already verified" });

    const { sent, error } = await issueAndEmailVerification(user);
    return res.json({
      ok: true,
      message: sent ? "Verification email resent" : "Could not send verification email",
      ...(error ? { devNote: error } : {}),
    });
  } catch (err) {
    console.error("resend error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/verify
router.get("/verify", async (req, res) => {
  try {
    const { token, email } = req.query || {};
    if (!token || !email) return res.status(400).send("Missing parameters");

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
      emailVerifyToken: tokenHash,
      emailVerifyExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).send("Invalid or expired token");

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    // Optionally mint a session token for web flows
    const jwtSecret = process.env.JWT_SECRET || "dev-only-secret";
    const jwtToken = jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, { expiresIn: "7d" });
    // res.cookie('auth', jwtToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7*24*3600*1000 });

    const redirect = `${POST_VERIFY_REDIRECT_URL}?email=${encodeURIComponent(user.email)}&ok=1`;
    return res.redirect(redirect);
  } catch (err) {
    console.error("verify error", err);
    return res.status(500).send("Server error");
  }
});

// POST /api/auth/login  (accepts emailOrUserName OR email OR userName)
router.post("/login", async (req, res) => {
  try {
    const { emailOrUserName, email, userName, password } = req.body || {};
    const identifier = String(emailOrUserName ?? email ?? userName ?? "").trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const q = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { userName: identifier.toLowerCase() };

    const user = await User.findOne(q).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email." });
    }

    const jwtSecret = process.env.JWT_SECRET || "dev-only-secret";
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, jwtSecret, { expiresIn: "7d" });
    return res.json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
