// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com", // <- fixed key
    port,
    // 587 uses STARTTLS (secure=false). 465 is SMTPS (secure=true)
    secure: port === 465,
    auth: {
      // Brevo:
      //   user = your Brevo SMTP login (e.g. 962028001@smtp-brevo.com)
      //   pass = your Brevo SMTP key
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transport;
}

/**
 * Send transactional email.
 * Optionally set REPLY_TO in env.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();

  const mail = {
    from: process.env.MAIL_FROM || "Trupee <support@trupee.me>",
    to,
    subject,
    html,
    text,
  };

  if (process.env.REPLY_TO) {
    mail.replyTo = process.env.REPLY_TO;
  }

  try {
    const info = await t.sendMail(mail);
    console.log("MAIL SENT:", { to, response: info?.response, messageId: info?.messageId });
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
