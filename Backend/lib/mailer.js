// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;
function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    ...(process.env.DEBUG_SMTP === "true" ? { logger: true, debug: true } : {})
  });
  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();
  const info = await t.sendMail({
    from: process.env.MAIL_FROM || "Trupee <support@trupee.me>",
    to, subject, html, text,
    replyTo: process.env.REPLY_TO || "support@trupee.me",
  });
  console.log("MAIL SENT:", { to, response: info?.response, messageId: info?.messageId });
  return info;
}
