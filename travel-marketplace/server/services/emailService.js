const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter based on environment
function createTransporter() {
  // Production: use SMTP settings from environment
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development: use Ethereal (fake SMTP for testing)
  logger.warn('SMTP not configured — emails will be logged to console only');
  return null;
}

const transporter = createTransporter();
const FROM = process.env.SMTP_FROM || 'Travely <noreply@travely.com>';
const CLIENT_URL = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',')[0].trim()
  : 'http://localhost:5173';

async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    logger.info(`[EMAIL] Body preview: ${html.replace(/<[^>]*>/g, '').slice(0, 200)}`);
    return { messageId: 'console-only', preview: true };
  }

  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    logger.error(`Email send error: ${err.message}`);
    throw err;
  }
}

// ── Password Reset Email ──
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0891b2; font-size: 28px; margin: 0;">Travely</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">Reset Your Password</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to set a new password. 
          This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2, #2563eb); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
          If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 24px;">
        © ${new Date().getFullYear()} Travely. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject: 'Reset Your Password — Travely', html });
}

// ── Email Verification Email ──
async function sendVerificationEmail(email, verificationToken, name) {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0891b2; font-size: 28px; margin: 0;">Travely</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px;">Verify Your Email</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 8px;">
          Hi ${name || 'there'} 👋
        </p>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px;">
          Welcome to Travely! Please verify your email address to unlock all features. 
          This link expires in <strong>24 hours</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2, #2563eb); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
          If you didn't create an account on Travely, you can safely ignore this email.
        </p>
      </div>
      <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 24px;">
        © ${new Date().getFullYear()} Travely. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject: 'Verify Your Email — Travely', html });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
};
