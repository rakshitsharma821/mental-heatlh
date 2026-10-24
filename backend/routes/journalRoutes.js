// ============================================
// MindCare Backend — Encrypted Journal Routes
// ============================================

import express from 'express';
import { journalController } from '../controllers/journalController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('client'));

router.post('/', journalController.createEntry);
router.get('/', journalController.getEntries);
router.delete('/:id', journalController.deleteEntry);

export default router;
