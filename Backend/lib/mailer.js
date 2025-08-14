// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let cachedTransport;

async function getTransport() {
  if (cachedTransport) return cachedTransport;

  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    RESEND_API_KEY
  } = process.env;

  // 1) Prefer explicit SMTP (Gmail) if configured
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 587;
    cachedTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // true for 465 (TLS), false for 587
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.info("[mail] Using configured SMTP:", SMTP_HOST, port);
    return cachedTransport;
  }

  // 2) Otherwise, fall back to Resend if API key is set
  if (RESEND_API_KEY) {
    cachedTransport = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: { user: "resend", pass: RESEND_API_KEY },
    });
    console.info("[mail] Using Resend SMTP");
    return cachedTransport;
  }

  // 3) Last resort: Ethereal (test only)
  const testAccount = await nodemailer.createTestAccount();
  cachedTransport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.warn("[mail] Using Ethereal (test). Emails will NOT be delivered to inboxes.");
  return cachedTransport;
}

export async function sendMail({ to, subject, html, text }) {
  const transport = await getTransport();

  const from =
    process.env.MAIL_FROM ||
    (process.env.SMTP_USER ? process.env.SMTP_USER : "Trupee <no-reply@example.com>");

  const info = await transport.sendMail({ from, to, subject, text, html });

  console.info("[mail] messageId:", info.messageId);

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.info("[mail] Preview URL:", preview);

  return info;
}
