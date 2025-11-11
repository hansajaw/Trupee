// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 587);
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error("❌ Missing SMTP credentials in environment variables.");
  }

  console.log("📨 Initializing SMTP transporter:", {
    host,
    port,
    user: user ? user.replace(/(.{2}).+(@.+)/, "$1***$2") : "undefined",
  });

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // STARTTLS on port 587
    auth: { user, pass },
  });

  // Verify connection (helps debug Gmail rejections)
  transport.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP connection failed:", error.message);
    } else {
      console.log("✅ SMTP connection verified.");
    }
  });

  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  try {
    const info = await getTransport().sendMail({
      from: process.env.MAIL_FROM || "Trupee <trupeeapp@gmail.com>",
      to,
      subject,
      html,
      text,
      replyTo: process.env.REPLY_TO || "trupeeapp@gmail.com",
    });
    console.log("✅ MAIL SENT via SMTP:", {
      to,
      response: info.response,
      messageId: info.messageId,
    });
    return info;
  } catch (err) {
    console.error("❌ Failed to send mail:", err.message);
    if (err.response) console.error("📩 SMTP Response:", err.response);
    throw err;
  }
}

export default { sendMail };
