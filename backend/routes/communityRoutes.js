import express from 'express';
import { communityController } from '../controllers/communityController.js';

const router = express.Router();

router.get('/circles', communityController.getCircles);
router.get('/circles/:circleId/posts', communityController.getPosts);
router.post('/circles/:circleId/posts', communityController.createPost);
router.post('/circles/:circleId/posts/:postId/cheer', communityController.cheerPost);

export default router;
