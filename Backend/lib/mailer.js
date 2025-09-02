// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.postmarkapp.com",
    port,
    // 587 uses STARTTLS (secure=false); 465 is SMTPS (secure=true)
    secure: port === 465,
    auth: {
      // For Postmark, BOTH user & pass are your Server API token
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transport;
}

/**
 * Send an email via SMTP.
 * If POSTMARK_STREAM is set (e.g., "outbound"), we pass it;
 * otherwise we omit the header entirely (Postmark defaults to "outbound").
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();

  const headers = {};
  if (process.env.POSTMARK_STREAM) {
    headers["X-PM-Message-Stream"] = process.env.POSTMARK_STREAM; // e.g., 'outbound'
  }

  try {
    const info = await t.sendMail({
      from: process.env.MAIL_FROM || "Trupee <no-reply@trupee.me>",
      to,
      subject,
      html,
      text,
      headers,
    });

    // Useful when debugging deployments
    console.log("MAIL SENT:", {
      to,
      response: info?.response,
      messageId: info?.messageId,
    });

    return info;
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
