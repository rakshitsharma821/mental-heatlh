// ============================================
// MindCare Backend — Encrypted Journal Routes
// ============================================

import express from 'express';
import { journalController } from '../controllers/journalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', journalController.createEntry);
router.get('/', journalController.getEntries);
router.delete('/:id', journalController.deleteEntry);

export default router;
