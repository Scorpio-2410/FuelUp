// utils/mailer.js
const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_NAME,
  APP_SUPPORT_URL,
  NODE_ENV,
} = process.env;

// Force logs to be quiet unless explicitly debugging
const enableVerbose = false; // change to true only if you need raw SMTP logs

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: String(SMTP_SECURE || "false") === "true",
  auth:
    SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  logger: enableVerbose,
  debug: enableVerbose,
});

async function sendMail({ to, subject, text, html }) {
  if (!SMTP_HOST) {
    console.warn("SMTP not configured. Email will be logged only.");
    console.log({ to, subject, text, html });
    return { mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || `"${APP_NAME || "App"} Support" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email queued:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return info;
  } catch (e) {
    console.error("Email send failed:", e && (e.response || e.message || e));
    throw e;
  }
}

function resetEmailTemplate({ code }) {
  const app = APP_NAME || "Our App";
  const support = APP_SUPPORT_URL || "#";
  const subject = `Your ${app} password reset code`;
  const text = [
    `We received a request to reset the password for your ${app} account.`,
    `Your verification code is: ${code}`,
    ``,
    `This code will expire in 15 minutes. If you didn't request this, you can ignore this email.`,
    ``,
    `— ${app} Team`,
    `Support: ${support}`,
  ].join("\n");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="margin:0 0 12px 0">${app} password reset</h2>
    <p style="margin:0 0 12px 0">We received a request to reset the password for your ${app} account.</p>
    <p style="margin:0 0 12px 0">Use this verification code within the next <strong>15 minutes</strong>:</p>
    <div style="font-size:28px;letter-spacing:6px;font-weight:700;border:1px dashed #cbd5e1;padding:12px 16px;display:inline-block;border-radius:8px">${code}</div>
    <p style="margin:16px 0 0 0;color:#6b7280">If you didn't request this, you can safely ignore this email.</p>
    <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb"/>
    <p style="margin:0;color:#6b7280">${app} • <a href="${support}">Support</a></p>
  </div>`;
  return { subject, text, html };
}

async function sendPasswordResetCode(email, code) {
  const { subject, text, html } = resetEmailTemplate({ code });
  return sendMail({ to: email, subject, text, html });
}

async function verifySmtp() {
  try {
    await transporter.verify();
    console.log("SMTP connection OK");
  } catch (e) {
    console.error("SMTP verify failed:", e && (e.response || e.message || e));
  }
}

module.exports = { sendPasswordResetCode, verifySmtp };
