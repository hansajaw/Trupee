import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendMail } from "../lib/mailer.js";

const router = express.Router();

const API_URL = process.env.API_URL || "http://localhost:3000";
const POST_VERIFY_REDIRECT_URL =
  process.env.POST_VERIFY_REDIRECT_URL || "http://localhost:5173/verified";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function verificationEmail({ name, url }) {
  const subject = "Verify your Trupee email";
  const safe = escapeHtml(name || "there");
  const html = `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:560px;margin:auto;padding:24px;border-radius:12px;background:#fff;border:1px solid #eee">
      <h2 style="margin:0 0 12px;">Hi ${safe} 👋</h2>
      <p>Please verify your email to finish creating your <b>Trupee</b> account.</p>
      <p style="margin:18px 0">
        <a href="${url}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Verify Email
        </a>
      </p>
      <p style="font-size:12px;color:#666">If the button doesn’t work, copy and paste this link:<br>
        <span style="word-break:break-all;color:#333">${url}</span>
      </p>
    </div>
  </body></html>`;
  const text = `Verify your Trupee email:\n${url}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

async function issueAndEmailVerification(user) {
  const rawToken = user.createEmailVerifyToken();
  await user.save();

  const url = `${API_URL}/api/auth/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(
    user.email
  )}`;
  const { subject, html, text } = verificationEmail({
    name: user.fullName || user.userName || user.email.split("@")[0],
    url,
  });

  // NOTE: while Postmark is in test mode, 'to' must be @trupee.me
  await sendMail({ to: user.email, subject, html, text });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, userName, fullName, password } = req.body || {};
    if (!email || !userName || !password) {
      return res.status(400).json({ message: "userName, email and password are required" });
    }

    const e = String(email).toLowerCase().trim();
    const u = String(userName).toLowerCase().trim();

    if (await User.findOne({ email: e })) return res.status(409).json({ message: "Email already in use" });
    if (await User.findOne({ userName: u })) return res.status(409).json({ message: "Username already in use" });

    const user = await User.create({ email: e, userName: u, fullName, password, isVerified: false });

    await issueAndEmailVerification(user);
    return res.json({ ok: true, message: "Verification email sent" });
  } catch (err) {
    console.error("register error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/resend
router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "email required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.json({ ok: true, message: "Already verified" });

    await issueAndEmailVerification(user);
    return res.json({ ok: true, message: "Verification email resent" });
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

    // optionally issue a session token
    const jwtToken = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // redirect to your success page
    const redirect = `${POST_VERIFY_REDIRECT_URL}?email=${encodeURIComponent(user.email)}&ok=1`;
    // Example cookie (same-site):
    // res.cookie('auth', jwtToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7*24*3600*1000 });
    return res.redirect(redirect);
  } catch (err) {
    console.error("verify error", err);
    return res.status(500).send("Server error");
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { emailOrUserName, password } = req.body || {};
    if (!emailOrUserName || !password) return res.status(400).json({ message: "Missing credentials" });

    const q =
      emailOrUserName.includes("@")
        ? { email: String(emailOrUserName).toLowerCase().trim() }
        : { userName: String(emailOrUserName).toLowerCase().trim() };

    const user = await User.findOne(q).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email." });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({ ok: true, token, user: user.toJSON() });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
