import "dotenv/config";
import express from "express";
import cors from "cors";
import { sendMail } from "./lib/mailer.js";
import { buildVerificationEmail } from "./email/verificationTemplate.js";
import { generateVerificationToken, verifyToken } from "./auth/tokens.js";
import { upsertUser, markVerified, getUser } from "./auth/users.js";

const app = express();
app.use(cors());
app.use(express.json());

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const WEB_BASE = process.env.WEB_BASE_URL || "http://localhost:5173";

/** helper: build verification URL sent to user */
function makeVerifyUrl(email) {
  const token = generateVerificationToken({ email });
  return `${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`;
}

/** POST /auth/signup  {email, name}  -> creates user and sends verification email */
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });

    // TEST MODE NOTE: while in Postmark test mode, 'email' must be @trupee.me
    upsertUser({ email, name });

    const verifyUrl = makeVerifyUrl(email);
    const { subject, html, text } = buildVerificationEmail({
      userName: name || email.split("@")[0],
      verifyUrl
    });

    await sendMail({ to: email, subject, html, text });

    res.json({ ok: true, message: "Verification email sent", verifyUrl }); // verifyUrl returned for dev convenience
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to send verification email", detail: err.message });
  }
});

/** GET /auth/verify?token=...  -> marks user verified and redirects to app */
app.get("/auth/verify", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing token");

  const result = verifyToken(token);
  if (!result.ok) return res.status(400).send("Invalid or expired token");

  const { email } = result.data || {};
  if (!email) return res.status(400).send("Malformed token");

  const u = markVerified(email);
  if (!u) return res.status(404).send("User not found");

  // Redirect user to your app (could show a success page)
  return res.redirect(`${WEB_BASE}/verified?email=${encodeURIComponent(email)}`);
});

/** (Optional) Resend endpoint */
app.post("/auth/resend", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = getUser(email);
    if (!user) return res.status(404).json({ error: "user not found" });
    if (user.verified) return res.json({ ok: true, message: "already verified" });

    const verifyUrl = makeVerifyUrl(email);
    const { subject, html, text } = buildVerificationEmail({
      userName: user.name || email.split("@")[0],
      verifyUrl
    });
    await sendMail({ to: email, subject, html, text });
    res.json({ ok: true, message: "resent" });
  } catch (e) {
    res.status(500).json({ error: "failed to resend", detail: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Trupee auth server running on http://localhost:${PORT}`);
});
