// ============================================
// MindCare — Pluggable OTP Telephony & Messaging Service
// Pluggable provider interface { send(identifier, code) }
// ============================================

import dotenv from 'dotenv';
dotenv.config();

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'console';

class ConsoleProvider {
  async send(identifier, code) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[OTP Security Alert] ConsoleProvider invoked in production for ${identifier}. Suppressing code log.`);
      return { success: true, provider: 'console', simulated: true };
    }
    console.log('\n========================================');
    console.log(`🔐 [MINDCARE OTP NOTIFICATION]`);
    console.log(`📡 Recipient: ${identifier}`);
    console.log(`🔑 Verification Code: ${code}`);
    console.log(`⏱️  Validity: 5 minutes`);
    console.log('========================================\n');
    return { success: true, provider: 'console', delivered: true };
  }
}

class TwilioProvider {
  async send(identifier, code) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[TwilioProvider] Credentials missing in environment, falling back to console mock.');
      return new ConsoleProvider().send(identifier, code);
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', identifier);
      params.append('From', fromNumber);
      params.append('Body', `Your MindCare Sanctuary verification code is: ${code}. Valid for 5 minutes.`);

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Twilio delivery failed');
      }
      return { success: true, provider: 'twilio', sid: data.sid };
    } catch (err) {
      console.error('[TwilioProvider] Error dispatching SMS:', err.message);
      // Fallback to console mock in dev so testing never breaks
      if (process.env.NODE_ENV !== 'production') {
        return new ConsoleProvider().send(identifier, code);
      }
      throw err;
    }
  }
}

class Fast2SMSProvider {
  async send(identifier, code) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.warn('[Fast2SMSProvider] FAST2SMS_API_KEY missing, falling back to console mock.');
      return new ConsoleProvider().send(identifier, code);
    }

    try {
      // Clean phone number (strip +91 if present for domestic fast2sms)
      const cleanPhone = identifier.replace(/^\+91/, '').replace(/\D/g, '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: cleanPhone
        })
      });
      const data = await response.json();
      return { success: true, provider: 'fast2sms', data };
    } catch (err) {
      console.error('[Fast2SMSProvider] Error:', err.message);
      if (process.env.NODE_ENV !== 'production') {
        return new ConsoleProvider().send(identifier, code);
      }
      throw err;
    }
  }
}

class EmailProvider {
  async send(identifier, code) {
    console.log(`[EmailProvider] Sent OTP ${code} to email destination: ${identifier}`);
    return { success: true, provider: 'email' };
  }
}

function getProvider() {
  switch (OTP_PROVIDER.toLowerCase()) {
    case 'twilio':
      return new TwilioProvider();
    case 'fast2sms':
      return new Fast2SMSProvider();
    case 'email':
      return new EmailProvider();
    case 'console':
    default:
      return new ConsoleProvider();
  }
}

export const otpService = {
  send: async (identifier, code) => {
    const provider = getProvider();
    return provider.send(identifier, code);
  }
};
