// ============================================
// MindCare Backend — AI Companion Memory Routes
// ============================================

import express from 'express';
import { companionController } from '../controllers/companionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/memory', companionController.saveMemory);
router.get('/memory', companionController.getMemories);
router.delete('/memory', companionController.clearMemories);

export default router;
