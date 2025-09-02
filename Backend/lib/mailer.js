// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

/** Create (or reuse) a Nodemailer transport. Never throws on creation. */
function getTransport() {
  if (transport) return transport;

  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  // Light sanity log (won't leak secrets)
  if (!user || !pass) {
    console.warn("[mailer] Warning: SMTP_USER or SMTP_PASS not set. Email sending will fail.");
  }

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 587 uses STARTTLS with secure=false
    auth: { user, pass },
  });

  return transport;
}

/**
 * Send a transactional email.
 * Throws with a detailed error if SMTP fails.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();

  const from = process.env.MAIL_FROM || "Trupee <support@trupee.me>";
  const mail = { from, to, subject, html, text };

  if (process.env.REPLY_TO) {
    mail.replyTo = process.env.REPLY_TO;
  }

  const info = await t.sendMail(mail);
  console.log("MAIL SENT:", { to, response: info?.response, messageId: info?.messageId });
  return info;
}

// Also export default so CJS imports like `const mailer = require(...).default` won't crash
export default { sendMail };
