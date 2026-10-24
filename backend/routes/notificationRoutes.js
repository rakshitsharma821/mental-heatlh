// ============================================
// MindCare Backend — Notification Routes (Part 7)
// ============================================

import express from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);
router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.get('/consent-history', notificationController.getConsentHistory);
router.post('/dispatch', notificationController.dispatch);

export default router;
