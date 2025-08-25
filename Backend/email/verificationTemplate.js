export function buildVerificationEmail({ userName, verifyUrl }) {
  const subject = "Verify your Trupee email";

  const html = `<!doctype html>
<html>
  <body style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,0.06);">
      <tr><td style="padding:28px 28px 8px;">
        <h2 style="margin:0 0 12px;">Hi ${escapeHtml(userName || "there")} 👋</h2>
        <p style="margin:0;color:#444;">Thanks for signing up for <b>Trupee</b>. Please verify your email address:</p>
        <p style="margin:20px 0;">
          <a href="${verifyUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Verify Email</a>
        </p>
        <p style="font-size:12px;color:#666;margin-top:22px;">
          If the button doesn’t work, copy and paste this link:<br>
          <span style="word-break:break-all;color:#1f2937;">${verifyUrl}</span>
        </p>
      </td></tr>
    </table>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:14px;">You’re receiving this because someone used this email to sign up to Trupee.</p>
  </body>
</html>`;

  const text =
`Hi ${userName || "there"},

Thanks for signing up for Trupee. Please verify your email:
${verifyUrl}

If you didn’t request this, you can ignore this email.`;

  return { subject, html, text };
}

// tiny util
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
