// routes/userRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// --- simple auth guard ---
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = sub;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * POST /api/users/change-password
 * body: { oldPassword, newPassword }
 * header: Authorization: Bearer <token>
 */
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword = "", newPassword = "" } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    // must select("+password") because password is select:false in the schema
    const user = await User.findById(req.userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    // set + save (pre('save') will hash it)
    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("change-password error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
