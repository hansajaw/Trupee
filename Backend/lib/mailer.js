import nodemailer from "nodemailer";

let transport;
function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port,
    secure: port === 465, // 587/2525 use STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

async function sendViaSMTP(mail) {
  const t = getTransport();
  return t.sendMail(mail);
}

async function sendViaBrevoAPI({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");
  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: (process.env.MAIL_FROM || "Trupee <support@trupee.me>").split("<")[0].trim(),
        email: (process.env.MAIL_FROM || "support@trupee.me").match(/<([^>]+)>/)?.[1] || "support@trupee.me",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: process.env.REPLY_TO || "support@trupee.me",
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brevo API error ${resp.status}: ${body}`);
  }
  return resp.json();
}

export async function sendMail({ to, subject, html, text }) {
  const mail = {
    from: process.env.MAIL_FROM || "Trupee <support@trupee.me>",
    to,
    subject,
    html,
    text,
    replyTo: process.env.REPLY_TO || "support@trupee.me",
  };

  // Prefer API (works even when SMTP is blocked)
  if (process.env.BREVO_API_KEY) {
    try {
      const r = await sendViaBrevoAPI({ to, subject, html, text });
      console.log("MAIL SENT via Brevo API:", { to, messageId: r?.messageId || r?.message?.messageId });
      return r;
    } catch (e) {
      console.error("Brevo API send failed:", e?.message || e);
      // optional: fall back to SMTP if you want
      // throw e;
    }
  }

  // Fallback to SMTP (if API not configured or API failed and you want to try SMTP)
  const info = await sendViaSMTP(mail);
  console.log("MAIL SENT via SMTP:", { to, response: info?.response, messageId: info?.messageId });
  return info;
}

export default { sendMail };
