// Backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/category.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { sendMail } from "./lib/mailer.js";

const app = express();

/* ------------------------------------------------------------------
   ✅ Environment Diagnostics
------------------------------------------------------------------ */
console.log("🟢 Starting Trupee backend...");
if (!process.env.MONGO_URL) {
  console.error("❌ Missing MONGO_URL in environment variables");
  process.exit(1);
}

/* ------------------------------------------------------------------
   ✅ MongoDB Connection (Vercel-safe)
------------------------------------------------------------------ */
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URL);
    isConnected = db.connections[0].readyState;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}
await connectDB();

/* ------------------------------------------------------------------
   ✅ Middleware
------------------------------------------------------------------ */
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.set("trust proxy", 1);

/* ------------------------------------------------------------------
   ✅ Routes
------------------------------------------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/ping", (_req, res) => res.send("pong"));

/* ---------- Email verification success page ---------- */
app.get("/verify-success", (req, res) => {
  const email = String(req.query.email || "");
  const safeEmail = email.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );

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
      ${
        safeEmail
          ? `<p style="margin:0 0 12px;color:#9ca3af;">for <b style="color:#e5e7eb">${safeEmail}</b></p>`
          : ""
      }
      <p style="margin:0 0 18px;color:#9ca3af;">You can close this tab and return to the Trupee app.</p>
      <a href="/" style="display:inline-block;background:#10b981;color:#0b1220;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;">Back to Home</a>
    </div>
  </body>
</html>`);
});

/* ------------------------------------------------------------------
   ✅ Diagnostic Routes
------------------------------------------------------------------ */
app.get("/__env-check", (_req, res) => {
  res.json({
    mongo: !!process.env.MONGO_URL,
    smtp_user: process.env.SMTP_USER ? "✅" : "❌",
    mail_from: process.env.MAIL_FROM,
    cors_origin: process.env.CORS_ORIGIN,
  });
});

app.get("/__smtp-test", async (_req, res) => {
  try {
    const info = await sendMail({
      to: "wickramahansaja@gmail.com",
      subject: "SMTP Test",
      text: "If you see this, your SMTP config works!",
      html: "<p>If you see this, your SMTP config works!</p>",
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

/* ------------------------------------------------------------------
   ✅ Error Handling
------------------------------------------------------------------ */
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error("Internal error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ------------------------------------------------------------------
   ✅ Export app for Vercel
------------------------------------------------------------------ */
export default app;

/* ------------------------------------------------------------------
   ✅ Local Development Mode
------------------------------------------------------------------ */
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
}
