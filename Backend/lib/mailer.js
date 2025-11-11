// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error("❌ Missing SMTP credentials (SMTP_USER / SMTP_PASS)");
    return null;
  }

  console.log("📨 Initializing transporter:", { host, port, user });

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL for 465
    auth: { user, pass },
  });

  // Verify SMTP connection immediately
  transport.verify((error, success) => {
    if (error) console.error("❌ SMTP verification failed:", error.message);
    else console.log("✅ SMTP transporter verified successfully");
  });

  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  const mailData = {
    from: process.env.MAIL_FROM || "Trupee <support@trupee.me>",
    to,
    subject,
    html,
    text,
    replyTo: process.env.REPLY_TO || "support@trupee.me",
  };

  const transporter = getTransport();
  if (!transporter) throw new Error("SMTP not configured");

  // Timeout safeguard
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Mail send timeout after 10s")), 10000)
  );

  try {
    const info = await Promise.race([
      transporter.sendMail(mailData),
      timeout,
    ]);
    console.log("✅ Mail sent via Zoho:", info.response || info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail send failed:", error.message);
    throw error;
  }
}
