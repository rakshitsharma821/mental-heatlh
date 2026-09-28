// ============================================
// MindCare Backend — Authentication Routes
// ============================================

import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/sync', authController.syncSession);
router.get('/me', authenticateToken, authController.me);
router.post('/recover', authController.recover);

export default router;
