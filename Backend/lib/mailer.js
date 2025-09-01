import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.postmarkapp.com",
    port,
    secure: port === 465,              // STARTTLS on 587 (secure=false) is fine
    auth: {
      user: process.env.SMTP_USER,     // Postmark Server API token
      pass: process.env.SMTP_PASS,     // same token
    },
  });

  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();

  // Use Postmark's default transactional stream unless you created a custom one
  const headers = {};
  const stream = process.env.POSTMARK_STREAM || "outbound"; // or just omit the header entirely
  if (stream) headers["X-PM-Message-Stream"] = stream;

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
    // Surface the real SMTP error so your API doesn't just say "Internal server error"
    console.error("Email send failed:", err?.response || err?.message || err);
    throw err;
  }
}
