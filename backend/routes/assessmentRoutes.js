// ============================================
// MindCare Backend — Assessment Routes
// ============================================

import express from 'express';
import { assessmentController } from '../controllers/assessmentController.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/welcome-message', authenticateToken, requireRole('client'), assessmentController.getWelcomeMessage);
router.post('/focus-start', authenticateToken, assessmentController.startFocusMode);
router.post('/focus-heartbeat', authenticateToken, assessmentController.heartbeatFocusMode);
router.post('/focus-end', authenticateToken, assessmentController.endFocusMode);
router.post('/submit', optionalAuth, assessmentController.saveAssessment);
router.post('/analyze', optionalAuth, assessmentController.analyzeReport);
router.get('/latest', authenticateToken, requireRole('client'), assessmentController.getLatestAssessment);

export default router;
