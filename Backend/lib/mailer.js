// Backend/lib/mailer.js
import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;

  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host: process.env.SMTPhOST || process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    // 587 uses STARTTLS (secure=false). 465 is SMTPS (secure=true)
    secure: port === 465,
    auth: {
      // Brevo SMTP:
      //   user = your Brevo SMTP login (looks like 123456789@smtp-brevo.com)
      //   pass = your Brevo SMTP key value
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transport;
}

/**
 * Send a plain transactional email.
 * replyTo is optional (set REPLY_TO env if you want replies).
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
