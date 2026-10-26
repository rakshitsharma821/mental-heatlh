// ============================================
// MindCare Backend — Authentication Routes
// ============================================

import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/register-therapist', authController.registerTherapist);
router.post('/send-registration-otp', authController.sendRegistrationOtp);
router.post('/verify-registration-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/recovery/request-otp', authController.requestRecoveryOtp);
router.post('/recovery/verify-otp', authController.verifyRecoveryOtp);
router.post('/recovery/complete', authController.completeRecovery);
router.post('/sync', authController.syncSession);
router.get('/me', authenticateToken, authController.me);
router.post('/recover', authController.recover);

export default router;
