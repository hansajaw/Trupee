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

// routes
app.use("/api/auth", authRoutes);

// health
app.get("/ping", (_, res) => res.send("pong"));

// TEMP: env check (remove later)
app.get("/__env-check", (req, res) => {
  res.json({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user_sample: (process.env.SMTP_USER || "").slice(0, 12) + "…",
    from: process.env.MAIL_FROM,
    replyTo: process.env.REPLY_TO || "(none)",
  });
});

// TEMP: SMTP test (remove later)
app.get("/__smtp-test", async (req, res) => {
  try {
    const info = await sendMail({
      to: "yourgmail@gmail.com",
      subject: "Trupee SMTP (Brevo) test",
      text: "If you see this, SMTP reached Brevo.",
      html: "<p>If you see this, SMTP reached Brevo.</p>",
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

async function start() {
  try {
    if (!MONGO_URL) throw new Error("Missing MONGO_URL in env");
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log("Server listening on", PORT);
      console.log("SMTP host:", process.env.SMTP_HOST);
      console.log("SMTP user:", (process.env.SMTP_USER || "").slice(0, 12) + "…");
      console.log("MAIL_FROM:", process.env.MAIL_FROM);
    });
  } catch (err) {
    console.error("Startup failed:", err?.message || err);
    process.exit(1);
  }
}

start();
