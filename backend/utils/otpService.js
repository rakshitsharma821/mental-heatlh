// ============================================
// MindCare Sanctuary — Pluggable OTP & Email Verification Service
// Defaults to EmailProvider (Gmail / SMTP via Nodemailer)
// ============================================

import dotenv from 'dotenv';
import { sendOtpEmail } from './emailService.js';
dotenv.config();

const OTP_PROVIDER = (process.env.OTP_PROVIDER || 'email').toLowerCase();

class EmailProvider {
  async send(identifier, code, context = 'verification') {
    return sendOtpEmail(identifier, code, context);
  }
}

class ConsoleProvider {
  async send(identifier, code, context = 'verification') {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[OTP Security Alert] ConsoleProvider invoked in production for ${identifier}. Suppressing code log.`);
      return { success: true, provider: 'console', simulated: true };
    }
    console.log('\n========================================');
    console.log(`🔐 [MINDCARE OTP NOTIFICATION]`);
    console.log(`📧 Recipient: ${identifier}`);
    console.log(`🔑 Verification Code: ${code}`);
    console.log(`⏱️  Validity: 5 minutes`);
    console.log(`📋 Context: ${context}`);
    console.log('========================================\n');
    return { success: true, provider: 'console', delivered: true };
  }
}

function getProvider() {
  switch (OTP_PROVIDER) {
    case 'console':
      return new ConsoleProvider();
    case 'email':
    default:
      return new EmailProvider();
  }
}

export const otpService = {
  /**
   * Dispatches OTP code to the specified email address.
   *
   * @param {string} identifier - Recipient email
   * @param {string} code - 6-digit verification code
   * @param {string} context - 'registration' | 'login' | 'recovery'
   */
  send: async (identifier, code, context = 'verification') => {
    const provider = getProvider();
    return provider.send(identifier, code, context);
  }
};
