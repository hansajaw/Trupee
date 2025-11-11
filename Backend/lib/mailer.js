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
  }

  console.log("📨 Initializing transporter:", { host, port, user });

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL for 465
    auth: { user, pass },
  });

  // Verify Zoho SMTP connection
  transport.verify((error, success) => {
    if (error) console.error("❌ Zoho SMTP verification failed:", error.message);
    else console.log("✅ Zoho SMTP transporter verified successfully");
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

  try {
    const info = await getTransport().sendMail(mailData);
    console.log("✅ Mail sent via Zoho:", info.response || info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail send failed:", error.message);
    throw error;
  }
}

export default { sendMail };
