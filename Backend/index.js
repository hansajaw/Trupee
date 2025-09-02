// Backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGO_URL = process.env.MONGO_URL;

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.set("trust proxy", 1);

// --- DB ---
if (!MONGO_URL) {
  console.error("Missing MONGO_URL in env");
  process.exit(1);
}
await mongoose.connect(MONGO_URL);
console.log("Connected to MongoDB");

// --- routes ---
app.use("/api/auth", authRoutes);

// health + debug
app.get("/ping", (_, res) => res.send("pong"));

// Debug: show which SMTP token/server your app is actually using
app.get("/__env-check", (req, res) => {
  res.json({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user_prefix: (process.env.SMTP_USER || "").slice(0, 8) + "…",
    from: process.env.MAIL_FROM,
    stream: process.env.POSTMARK_STREAM || "(none)",
    skip_email: process.env.SKIP_EMAIL || "false",
    api_url: process.env.API_URL,
  });
});

// Optional one-off direct send test (remove in prod)
import { sendMail } from "./lib/mailer.js";
app.get("/__smtp-test", async (req, res) => {
  try {
    const info = await sendMail({
      to: "yourgmail@gmail.com",
      subject: "Trupee SMTP test",
      text: "If you see this, SMTP reached Postmark.",
      html: "<p>If you see this, SMTP reached Postmark.</p>",
    });
    res.json({ ok: true, response: info?.response, messageId: info?.messageId });
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

app.listen(PORT, () => {
  console.log("Server listening on", PORT);
  console.log("SMTP token prefix:", (process.env.SMTP_USER || "").slice(0, 8) + "…");
  console.log("Stream:", process.env.POSTMARK_STREAM || "(none)");
});
