// Backend/lib/mailer.js
// Uses Brevo HTTP API first (works even if SMTP ports are blocked).
// Falls back to SMTP ONLY if BREVO_API_KEY isn't set.

import nodemailer from "nodemailer";

let transport;
function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465, // 587/2525 use STARTTLS with secure=false
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

async function sendViaBrevoAPI({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");

  const fromRaw = process.env.MAIL_FROM || "Trupee <support@trupee.me>";
  const senderEmail = fromRaw.match(/<([^>]+)>/)?.[1] || "support@trupee.me";
  const senderName = (fromRaw.split("<")[0] || "Trupee").trim();

  if (typeof fetch !== "function") {
    throw new Error("Global fetch not found. Use Node 18+ or add node-fetch.");
  }

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: process.env.REPLY_TO || "support@trupee.me",
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brevo API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export async function sendMail({ to, subject, html, text }) {
  // Prefer API (no SMTP ports needed)
  if (process.env.BREVO_API_KEY) {
    const r = await sendViaBrevoAPI({ to, subject, html, text });
    console.log("MAIL SENT via Brevo API:", { to, messageId: r?.messageId || r?.message?.messageId });
    return r;
  }

  // Fallback to SMTP if API key not set (note: your host may block SMTP)
  const info = await getTransport().sendMail({
    from: process.env.MAIL_FROM || "Trupee <support@trupee.me>",
    to,
    subject,
    html,
    text,
    replyTo: process.env.REPLY_TO || "support@trupee.me",
  });
  console.log("MAIL SENT via SMTP:", { to, response: info?.response, messageId: info?.messageId });
  return info;
}

export default { sendMail };
