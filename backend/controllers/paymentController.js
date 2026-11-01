// ============================================
// MindCare Backend — Payment & Webhook Security Controller
// Enforces cryptographic HMAC-SHA256 signature verification,
// replay attack prevention, and state-validated checkout for consultations
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { safeCompare } from '../utils/crypto.js';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.ENCRYPTION_KEY;
if (!WEBHOOK_SECRET) {
  throw new Error('FATAL: PAYMENT_WEBHOOK_SECRET or ENCRYPTION_KEY required for payment security.');
}

export const paymentController = {
  /**
   * Create a secure payment order intent for a clinical session
   */
  createOrder: async (req, res) => {
    try {
      const { sessionId, amount, currency = 'INR' } = req.body;
      const clientId = req.user.id;

      if (!sessionId || !amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'InvalidOrder',
          message: 'Valid sessionId and numeric amount are required.'
        });
      }

      // Verify the session belongs to this client
      const sessionRes = await db.query(
        'SELECT id, client_id, therapist_id, status FROM session_bookings WHERE id = $1',
        [sessionId]
      );

      if (sessionRes.rows.length === 0 || sessionRes.rows[0].client_id !== clientId) {
        return res.status(404).json({
          success: false,
          error: 'SessionNotFound',
          message: 'Clinical session not found or unauthorized.'
        });
      }

      const orderId = 'order_' + crypto.randomBytes(12).toString('hex');
      const timestamp = Date.now();

      // Sign the order payload with HMAC-SHA256
      const signaturePayload = `${orderId}|${sessionId}|${amount}|${currency}|${timestamp}`;
      const orderSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signaturePayload)
        .digest('hex');

      return res.status(201).json({
        success: true,
        order: {
          orderId,
          sessionId,
          amount: Number(amount),
          currency,
          timestamp,
          signature: orderSignature
        }
      });
    } catch (err) {
      console.error('Create order error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to initiate order.' });
    }
  },

  /**
   * Verify completed payment signature
   */
  verifyPayment: async (req, res) => {
    try {
      const { orderId, paymentId, signature } = req.body;

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({
          success: false,
          error: 'InvalidVerification',
          message: 'orderId, paymentId, and signature are required.'
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const isValid = safeCompare(expectedSignature, signature);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'SignatureMismatch',
          message: 'Payment verification failed: Signature mismatch.'
        });
      }

      return res.json({
        success: true,
        verified: true,
        orderId,
        paymentId,
        message: 'Payment signature verified successfully.'
      });
    } catch (err) {
      console.error('Verify payment error:', err.message);
      return res.status(500).json({ success: false, message: 'Payment verification error.' });
    }
  },

  /**
   * Secure Webhook Handler (Raw signature validation + Replay attack defense)
   */
  handleWebhook: async (req, res) => {
    try {
      const signatureHeader = req.headers['x-webhook-signature'];
      const timestampHeader = req.headers['x-webhook-timestamp'];

      if (!signatureHeader || !timestampHeader) {
        return res.status(400).json({
          success: false,
          error: 'MissingSignatureHeaders',
          message: 'Webhook request rejected: Missing security headers.'
        });
      }

      // Replay Attack Defense: tolerance of 5 minutes (300,000 ms)
      const now = Date.now();
      const eventTime = parseInt(timestampHeader, 10);
      if (isNaN(eventTime) || Math.abs(now - eventTime) > 300000) {
        return res.status(400).json({
          success: false,
          error: 'TimestampExpired',
          message: 'Webhook request rejected: Timestamp expired or skewed.'
        });
      }

      const rawPayload = JSON.stringify(req.body);
      const computedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(`${timestampHeader}.${rawPayload}`)
        .digest('hex');

      if (!safeCompare(computedSignature, signatureHeader)) {
        return res.status(403).json({
          success: false,
          error: 'InvalidWebhookSignature',
          message: 'Webhook request rejected: Cryptographic signature invalid.'
        });
      }

      // Process event safely
      const event = req.body;
      console.log(`[Webhook Event Processed] Type: ${event.type || 'unknown'}`);

      return res.json({ success: true, processed: true });
    } catch (err) {
      console.error('Webhook error:', err.message);
      return res.status(500).json({ success: false, message: 'Webhook processing error.' });
    }
  }
};

export default paymentController;
