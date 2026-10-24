// ============================================
// MindCare Backend — Assessment Routes
// ============================================

import express from 'express';
import { assessmentController } from '../controllers/assessmentController.js';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/welcome-message', authenticateToken, assessmentController.getWelcomeMessage);
router.post('/focus-start', authenticateToken, assessmentController.startFocusMode);
router.post('/focus-end', authenticateToken, assessmentController.endFocusMode);
router.post('/submit', optionalAuth, assessmentController.saveAssessment);
router.get('/latest', authenticateToken, assessmentController.getLatestAssessment);

export default router;
