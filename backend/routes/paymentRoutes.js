// ============================================
// MindCare Backend — Payment & Webhook Routes
// Enforces JWT authentication on checkout and HMAC signature verification on webhooks
// ============================================

import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Order generation & verification (Client authenticated)
router.post('/create-order', authenticateToken, paymentController.createOrder);
router.post('/verify', authenticateToken, paymentController.verifyPayment);

// Webhook endpoint (Machine-to-machine, verified via HMAC-SHA256 signature)
router.post('/webhook', paymentController.handleWebhook);

export default router;
