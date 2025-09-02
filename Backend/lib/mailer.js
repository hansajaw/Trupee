// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.postmarkapp.com",
    port,
    secure: port === 465, // 587 uses STARTTLS
    auth: {
      user: process.env.SMTP_USER, // Postmark Server API token
      pass: process.env.SMTP_PASS, // same token
    },
  });
  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();

  // Only set stream header if you actually configured it (default is 'outbound')
  const headers = {};
  if (process.env.POSTMARK_STREAM) {
    headers["X-PM-Message-Stream"] = process.env.POSTMARK_STREAM; // e.g. 'outbound'
  }

  try {
    return await t.sendMail({
      from: process.env.MAIL_FROM || "Trupee <no-reply@trupee.me>",
      to,
      subject,
      html,
      text,
      headers,
    });
  } catch (err) {
    console.error("Email send failed:", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    });
    throw err;
  }
}
