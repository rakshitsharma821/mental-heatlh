// ============================================
// MindCare Sanctuary — Express Backend Server
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Routes
import authRoutes from './routes/authRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import companionRoutes from './routes/companionRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import clinicalRoutes from './routes/clinicalRoutes.js';
import communityRoutes from './routes/communityRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/community', communityRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MindCare Sanctuary Backend API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root friendly greeting
app.get('/', (req, res) => {
  res.json({
    message: 'MindCare Sanctuary API Server is running.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      clinical: '/api/clinical',
      community: '/api/community'
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🌿 MindCare Sanctuary Backend running on port ${PORT}`);
  console.log(`📡 Accepting client connections from: ${CLIENT_ORIGIN}`);
});
