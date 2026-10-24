// ============================================
// MindCare Backend — Activity Routes
// ============================================

import express from 'express';
import { activityController } from '../controllers/activityController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('client'));

router.post('/', activityController.logActivity);
router.get('/', activityController.getActivities);

export default router;
