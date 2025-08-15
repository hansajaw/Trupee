import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import categoryRoutes from "./routes/category.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get("/verify-success", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verified</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background-color: #f8f9fa;
          color: #333;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 20px;
        }
        p {
          font-size: 1.2rem;
        }
      </style>
    </head>
    <body>
      <h1>✅ Email Verified Successfully!</h1>
      <p>You can now return to the Trupee app.</p>
    </body>
    </html>
  `);
});


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
