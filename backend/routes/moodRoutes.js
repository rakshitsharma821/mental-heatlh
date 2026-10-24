// ============================================
// MindCare Backend — Mood Tracking Routes
// ============================================

import express from 'express';
import { moodController } from '../controllers/moodController.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, moodController.logMood);
router.get('/history', authenticateToken, requireRole('client'), moodController.getHistory);
router.get('/analytics', authenticateToken, requireRole('client'), moodController.getAnalytics);

export default router;
