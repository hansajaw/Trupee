import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendMail } from "../lib/mailer.js";

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });

// auth guard
const requireAuth = (req, _res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return next(Object.assign(new Error("Unauthorized"), { status: 401 }));
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = userId;
    next();
  } catch {
    next(Object.assign(new Error("Invalid token"), { status: 401 }));
  }
};

// ---------- register: send verification email ----------
router.post("/register", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const userName = (req.body.userName || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!userName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 8)
      return res.status(400).json({ message: "Password should be at least 8 characters" });
    if (userName.length < 3)
      return res.status(400).json({ message: "Username should be at least 3 characters" });

    if (await User.findOne({ userName })) return res.status(400).json({ message: "Username already exists" });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already exists" });

    const profileImage = `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${encodeURIComponent(userName)}`;

    const user = new User({ email, userName, password, profileImage });
    const token = user.createEmailVerifyToken();
    await user.save();

    const verifyUrl = `${process.env.API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: email,
      subject: "Verify your Trupee account",
      html: `
        <p>Hi ${userName},</p>
        <p>Click the button below to verify your email address.</p>
        <p><a href="${verifyUrl}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify Email</a></p>
        <p>Or open this link: <br/>${verifyUrl}</p>
      `,
      text: `Verify your Trupee account: ${verifyUrl}`
    });

    return res.status(201).json({ message: "Verification email sent" });
  } catch (e) {
    console.error("register error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------- verify email ----------
router.get("/verify-email", async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).send("Invalid verify link");

    const user = await User.findOne({ email: String(email).toLowerCase().trim(), emailVerifyToken: token });
    if (!user) return res.status(400).send("Invalid or expired token");
    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date())
      return res.status(400).send("Token expired, please register again");

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    // simple success page
    res.setHeader("Content-Type", "text/html");
    return res.send(`<h3>Email verified ✅</h3><p>You can now open the app and log in.</p>`);
  } catch (e) {
    console.error("verify-email error", e);
    return res.status(500).send("Server error");
  }
});

// ---------- login (require verified) ----------
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials!" });
    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials!" });

    const token = generateToken(user._id);
    return res.json({
      token,
      user: { id: user._id, username: user.userName, email: user.email, profileImage: user.profileImage },
    });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ---------- me ----------
router.get("/me", requireAuth, async (req, res) => {
  const u = await User.findById(req.userId).select("_id userName email profileImage isVerified");
  if (!u) return res.status(404).json({ message: "User not found" });
  return res.json({ id: u._id, username: u.userName, email: u.email, profileImage: u.profileImage, isVerified: u.isVerified });
});

// ---------- change password ----------
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "oldPassword and newPassword are required" });
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });

    const user = await User.findById(req.userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.status(400).json({ message: "Old password is incorrect" });

    user.password = newPassword;
    await user.save();
    return res.json({ success: true });
  } catch (e) {
    console.error("change-password error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const token = user.createEmailVerifyToken();
    await user.save();

    const verifyUrl = `${process.env.API_URL}/api/auth/verify-email?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: "Verify your Trupee account",
      text: `Click to verify your email: ${verifyUrl}`,
    });

    return res.json({ message: "Verification email resent" });
  } catch (e) {
    console.error("resend-verification error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
