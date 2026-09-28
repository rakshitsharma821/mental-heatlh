// ============================================
// MindCare Backend — Mood Tracking Routes
// ============================================

import express from 'express';
import { moodController } from '../controllers/moodController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(optionalAuth);

router.post('/', moodController.logMood);
router.get('/history', moodController.getHistory);
router.get('/analytics', moodController.getAnalytics);

export default router;
