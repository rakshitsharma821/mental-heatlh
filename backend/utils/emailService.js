// ============================================
// MindCare Sanctuary — Email Gateway Service
// Sends verified transactional OTPs via Google / Gmail SMTP (or custom SMTP)
// Powered by Nodemailer with graceful dev/test fallback
// ============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

let cachedTransporter = null;

/**
 * Returns a configured Nodemailer transporter or null if credentials are unconfigured.
 */
export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const service = process.env.EMAIL_SERVICE; // e.g. 'gmail'
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  // If credentials are empty or default placeholders, return null (fallback to console logging)
  if (!user || !pass || user === 'your-email@gmail.com' || pass === 'your-google-app-password') {
    return null;
  }

  try {
    if (service && service.toLowerCase() === 'gmail') {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });
      return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 465,
      secure: process.env.EMAIL_SECURE !== 'false', // true for port 465, false for 587
      auth: {
        user,
        pass
      }
    });
    return cachedTransporter;
  } catch (err) {
    console.error('Error creating email transporter:', err.message);
    return null;
  }
}

/**
 * Sends a 6-digit verification OTP email with beautiful, serene MindCare branding.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit numeric verification code
 * @param {string} context - 'registration' | 'login' | 'recovery'
 */
export async function sendOtpEmail(toEmail, otpCode, context = 'verification') {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  const transporter = getTransporter();

  const appName = 'MindCare Sanctuary';
  const fromEmail = process.env.EMAIL_USER || 'no-reply@mindcare.org';
  const fromAddress = process.env.EMAIL_FROM || `"${appName}" <${fromEmail}>`;

  let subject = 'Your MindCare Verification Code';
  let heading = 'Email Verification Code';
  let messageIntro = 'Use the 6-digit verification code below to verify your email address.';

  if (context === 'login') {
    subject = 'MindCare Sanctuary — Login Verification Code';
    heading = 'Secure Login Verification';
    messageIntro = 'A login request was initiated for your MindCare account. Use the code below to complete sign-in:';
  } else if (context === 'recovery') {
    subject = 'MindCare Sanctuary — Account Recovery Code';
    heading = 'Account Access Recovery';
    messageIntro = 'A password or credential recovery request was submitted. Use the code below to continue:';
  } else if (context === 'registration') {
    subject = 'MindCare Sanctuary — Verify Your Email';
    heading = 'Confirm Your Email Address';
    messageIntro = 'Thank you for joining MindCare Sanctuary. Please verify your email with the code below:';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          margin: 0;
          padding: 32px 16px;
          background-color: #FBFAF7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          padding: 36px 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        .header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 20px;
          font-weight: 700;
          color: #2d6a4f;
          letter-spacing: -0.3px;
        }
        .title {
          font-size: 19px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }
        .code-box {
          background-color: #f4f7f4;
          border: 1.5px dashed #52b788;
          border-radius: 12px;
          padding: 22px 16px;
          text-align: center;
          margin: 24px 0;
        }
        .code {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 9px;
          color: #2d6a4f;
          font-family: 'Courier New', Courier, monospace;
        }
        .badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-top: 8px;
        }
        .security-notice {
          font-size: 13px;
          line-height: 1.5;
          color: #64748b;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }
        .footer {
          margin-top: 28px;
          font-size: 11px;
          line-height: 1.6;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="brand">🌿 MindCare Sanctuary</span>
        </div>
        <div class="title">${heading}</div>
        <div class="intro">
          Hello,<br><br>
          ${messageIntro}
        </div>

        <div class="code-box">
          <div class="code">${otpCode}</div>
          <div class="badge">⏱️ Valid for 5 minutes • One-time use only</div>
        </div>

        <div class="security-notice">
          <strong>Security Note:</strong> Never share this code with anyone. MindCare Sanctuary staff will never request your code via phone or email. If you did not make this request, you can safely ignore this email.
        </div>

        <div class="footer">
          MindCare Sanctuary — Confidential Mental Wellness & Clinical Support<br>
          Protected under DPDP Act 2023 & Zero-Trust Architecture
        </div>
      </div>
    </body>
    </html>
  `;

  // Fallback if transporter is not configured: log cleanly in dev console
  if (!transporter) {
    console.log('\n========================================');
    console.log(`🔐 [EMAIL OTP NOTIFICATION]`);
    console.log(`📧 Recipient: ${cleanEmail}`);
    console.log(`🔑 Verification Code: ${otpCode}`);
    console.log(`⏱️  Validity: 5 minutes`);
    console.log(`ℹ️  Context: ${context}`);
    console.log(`💡 To dispatch real emails via Gmail, set EMAIL_USER & EMAIL_PASS in backend/.env`);
    console.log('========================================\n');
    return { success: true, simulated: true, provider: 'console-fallback' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject,
      text: `${heading}\n\nYour 6-digit MindCare verification code is: ${otpCode}\n\nThis code is valid for 5 minutes. Never share this code with anyone.`,
      html: htmlContent
    });

    console.log(`✅ [EmailService] OTP email sent to ${cleanEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, provider: 'nodemailer' };
  } catch (err) {
    console.error(`❌ [EmailService] Error sending email to ${cleanEmail}:`, err.message);
    // In dev or when SMTP credentials fail, print code to console so user can still test
    console.log(`🔑 [CONSOLE FALLBACK CODE]: ${otpCode} for ${cleanEmail}`);
    return { success: false, error: err.message, fallbackCode: otpCode };
  }
}
