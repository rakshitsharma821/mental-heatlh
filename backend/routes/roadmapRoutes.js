// ============================================
// MindCare Backend — Therapy Roadmap Routes
// ============================================

import express from 'express';
import { roadmapController } from '../controllers/roadmapController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', roadmapController.getRoadmap);
router.post('/milestones/:milestoneId/toggle', roadmapController.toggleMilestone);
router.post('/track', roadmapController.switchTrack);

export default router;
