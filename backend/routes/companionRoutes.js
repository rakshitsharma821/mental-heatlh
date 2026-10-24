// ============================================
// MindCare Backend — AI Companion Memory & Chat Routes
// ============================================

import express from 'express';
import { companionController } from '../controllers/companionController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/memory', authenticateToken, companionController.saveMemory);
router.get('/memory', authenticateToken, companionController.getMemories);
router.delete('/memory', authenticateToken, companionController.clearMemories);
router.delete('/conversation/:conversationId', authenticateToken, companionController.endConversation);
router.post('/chat', authenticateToken, companionController.chat);

export default router;
