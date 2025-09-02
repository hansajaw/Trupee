// Backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import { sendMail } from "./lib/mailer.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGO_URL = process.env.MONGO_URL;

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.set("trust proxy", 1);

// API routes
app.use("/api/auth", authRoutes);

// health
app.get("/ping", (_req, res) => res.send("pong"));

/* ---------- NEW: verification success page ---------- */
app.get("/verify-success", (req, res) => {
  const email = String(req.query.email || "");
  const safeEmail = email.replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));

  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Trupee — Email verified</title>
  </head>
  <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b1220;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
    <div style="text-align:center;max-width:520px;padding:24px;border-radius:16px;background:#0f172a;border:1px solid #1f2937;box-shadow:0 10px 30px rgba(0,0,0,.35)">
      <div style="font-size:44px;line-height:1;margin-bottom:8px">✅</div>
      <h2 style="margin:0 0 6px;font-size:22px;color:#fff;">Email verified</h2>
      ${safeEmail ? `<p style="margin:0 0 12px;color:#9ca3af;">for <b style="color:#e5e7eb">${safeEmail}</b></p>` : ""}
      <p style="margin:0 0 18px;color:#9ca3af;">You can close this tab and return to the Trupee app.</p>
      <a href="/" style="display:inline-block;background:#10b981;color:#0b1220;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;">Back to Home</a>
    </div>
  </body>
</html>`);
});
/* --------------------------------------------------- */

// Debug: env in use (no secrets)
app.get("/__env-check", (_req, res) => {
  res.json({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user_sample: (process.env.SMTP_USER || "").slice(0, 12) + "…",
    from: process.env.MAIL_FROM,
    has_brevo_api_key: Boolean(process.env.BREVO_API_KEY),
  });
});

// Test: send a real email (uses API first)
app.get("/__smtp-test", async (_req, res) => {
  try {
    const info = await sendMail({
      to: "wickramahansaja@gmail.com",
      subject: "SMTP/API test",
      text: "If you see this, delivery works.",
      html: "<p>If you see this, delivery works.</p>",
    });
    res.json({ ok: true, info });
  } catch (e) {
    res.status(500).json({
      ok: false,
      message: e?.message,
      code: e?.code,
      response: e?.response,
      responseCode: e?.responseCode,
    });
  }
});

async function start() {
  try {
    if (!MONGO_URL) throw new Error("Missing MONGO_URL in env");
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log("Server listening on", PORT));
  } catch (err) {
    console.error("Startup failed:", err?.message || err);
    process.exit(1);
  }
}

start();
