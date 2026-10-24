// ============================================
// MindCare Backend — AI Companion Memory & Chat Routes
// ============================================

import express from 'express';
import { companionController } from '../controllers/companionController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('client'));

router.post('/memory', companionController.saveMemory);
router.get('/memory', companionController.getMemories);
router.delete('/memory', companionController.clearMemories);
router.delete('/conversation/:conversationId', companionController.endConversation);
router.post('/chat', companionController.chat);

export default router;
