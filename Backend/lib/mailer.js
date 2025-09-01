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
  try {
    return await t.sendMail({
      from: process.env.MAIL_FROM || "Trupee <no-reply@trupee.me>",
      to, subject, html, text,
      // headers: { "X-PM-Message-Stream": "outbound" }, // only if you want it
    });
  } catch (err) {
    console.error("Email send failed:", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,        // Postmark SMTP explanation
      responseCode: err?.responseCode // numeric SMTP code
    });
    throw err; // keeps your current 500 so you notice it
  }
}

