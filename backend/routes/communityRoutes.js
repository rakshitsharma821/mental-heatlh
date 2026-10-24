// ============================================
// MindCare Backend — Community Sanctuary Routes (Part 6)
// ============================================

import express from 'express';
import { communityController } from '../controllers/communityController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 1. Anonymous Community Profile
router.get('/profile', authenticateToken, communityController.getProfile);
router.put('/profile', authenticateToken, communityController.updateProfile);

// 2. Thematic Circles & Posts
router.get('/circles', communityController.getCircles);
router.get('/circles/:circleId/posts', communityController.getPosts);
router.post('/circles/:circleId/posts', authenticateToken, communityController.createPost);

// 3. Heart Reactions & Reporting
router.post('/posts/:postId/heart', authenticateToken, communityController.heartPost);
router.post('/circles/:circleId/posts/:postId/cheer', authenticateToken, communityController.heartPost); // Backward-compat
router.post('/posts/:postId/report', authenticateToken, communityController.reportPost);

// 4. Peer Support Matching
router.post('/peer-match/request', authenticateToken, communityController.requestPeerMatch);
router.get('/peer-match/status', authenticateToken, communityController.getPeerMatchStatus);
router.post('/peer-match/leave', authenticateToken, communityController.leavePeerMatch);
router.post('/peer-match/block', authenticateToken, communityController.blockPeerMatch);
router.post('/admin/features', authenticateToken, requireAdmin, communityController.setFeatureFlag);

export default router;
