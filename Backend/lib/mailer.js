import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.postmarkapp.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER, // Postmark Server Token
      pass: process.env.SMTP_PASS  // same token
    }
  });
  return transport;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();
  return t.sendMail({
    from: process.env.MAIL_FROM || "Trupee <no-reply@trupee.me>",
    to,
    subject,
    html,
    text,
    headers: {
      "X-PM-Message-Stream": process.env.POSTMARK_STREAM || "verification",
      "List-Unsubscribe": "<mailto:unsubscribe@trupee.me>, <https://trupee.me/unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    }
  });
}
