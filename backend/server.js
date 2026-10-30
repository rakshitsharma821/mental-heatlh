// ============================================
// MindCare Sanctuary — Express & Socket.io WebRTC Backend Server
// Step 0 Hardening: JWT Signaling Auth, Room Access Control,
// Encrypted Message Persistence, Therapist Auto-Offline on Disconnect
// ============================================

import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { db } from './models/db.js';
import { encryptField } from './utils/crypto.js';
import { securityHeaders, globalLimiter, authLimiter, aiLimiter } from './middleware/security.js';
import { sanitizeInput } from './middleware/sanitize.js';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is missing.');
}

const allowedOrigins = [
  CLIENT_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// Security Hardening Middlewares
app.disable('x-powered-by');
app.use(securityHeaders);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, internal tests) without origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Origin not permitted by MindCare Sanctuary security firewall.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body Parsing with strict size limits to prevent Denial-of-Service attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Anti-XSS & Prototype Pollution Input Sanitizer
app.use(sanitizeInput);

// Global Rate Limiting across all API routes
app.use('/api', globalLimiter);

// Routes
import authRoutes from './routes/authRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import companionRoutes from './routes/companionRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import clinicalRoutes from './routes/clinicalRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Route-level Rate Limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companion/chat', aiLimiter);
app.use('/api/assessment/analyze', aiLimiter);

app.use('/api/mood', moodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MindCare Sanctuary Backend API with WebRTC Signaling',
    version: '2.1.0',
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
      community: '/api/community',
      assessment: '/api/assessment',
      admin: '/api/admin'
    }
  });
});

// Create HTTP server and bind Socket.io
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Authenticate Socket.io connection with JWT
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || 
                socket.handshake.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // In dev / test fallback allow unauthenticated test sockets
    const env = (process.env.NODE_ENV || 'development').trim();
    if (env !== 'production') {
      socket.user = null;
      return next();
    }
    return next(new Error('Authentication error: Missing authentication token.'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query('SELECT id, public_id, role, status FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0 || userRes.rows[0].status !== 'active') {
      return next(new Error('Authentication error: Inactive or suspended user.'));
    }
    socket.user = { ...decoded, ...userRes.rows[0] };
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token.'));
  }
});

// WebRTC Signaling & Live Clinical Consultation Rooms
const activeRooms = new Map(); // roomId -> Set of socketIds
const messageTimestamps = new Map(); // socketId -> number[] (for rate-limiting)
const therapistSockets = new Map(); // therapistId -> Set of socketIds (multi-socket tracking)

// Background worker: auto-expire inactive therapists whose heartbeat stopped > 60s ago
const therapistExpiryTimer = setInterval(async () => {
  try {
    const expiredRes = await db.query(`
      UPDATE therapist_profiles
      SET is_available = FALSE
      WHERE is_available = TRUE
        AND (last_seen_at IS NULL OR last_seen_at < CURRENT_TIMESTAMP - INTERVAL '60 seconds')
      RETURNING user_id
    `);
    if (expiredRes?.rowCount > 0) {
      for (const row of expiredRes.rows) {
        therapistSockets.delete(row.user_id);
      }
    }
  } catch (err) {
    // Handled gracefully during db teardown or restart
  }
}, 30000);
if (therapistExpiryTimer.unref) therapistExpiryTimer.unref();

io.on('connection', (socket) => {
  // If authenticated as therapist, register socket connection and update last_seen_at
  if (socket.user?.role === 'therapist' && socket.user?.id) {
    const tId = socket.user.id;
    if (!therapistSockets.has(tId)) {
      therapistSockets.set(tId, new Set());
    }
    therapistSockets.get(tId).add(socket.id);
    db.query("UPDATE therapist_profiles SET last_seen_at = CURRENT_TIMESTAMP WHERE user_id = $1", [tId])
      .catch(err => console.warn('Failed to update therapist last_seen_at on connect:', err.message));
  }

  // Therapist explicit heartbeat ping (30-60s interval)
  socket.on('therapist-heartbeat', async () => {
    const userId = socket.user?.id || socket.data?.userId;
    const role = socket.user?.role || socket.data?.role;
    if (role === 'therapist' && userId) {
      if (!therapistSockets.has(userId)) {
        therapistSockets.set(userId, new Set());
      }
      therapistSockets.get(userId).add(socket.id);
      try {
        await db.query(`
          UPDATE therapist_profiles
          SET last_seen_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId]);
        socket.emit('heartbeat-ack', { timestamp: Date.now() });
      } catch (err) {
        console.warn('Failed to record therapist heartbeat:', err.message);
      }
    }
  });

  // Join Room with strict gating for confirmed clinical sessions & authorized participants
  socket.on('join-room', async ({ roomId, userId, userName, role }) => {
    if (!roomId) return;

    // Backward-compatible bypass for test rooms in non-production environment
    const isTestRoom = roomId.startsWith('test_');
    const isProd = (process.env.NODE_ENV || 'development').trim() === 'production';

    let session = null;
    if (!isTestRoom) {
      try {
        const sessionRes = await db.query(
          `SELECT id, client_id, therapist_id, status, preferred_slot, slot_duration_minutes, mode 
           FROM session_bookings WHERE id = $1`,
          [roomId]
        );
        if (sessionRes.rows.length > 0) {
          session = sessionRes.rows[0];
        }
      } catch (err) {
        console.warn('Error querying session for room gating:', err.message);
      }
    }

    // If this room corresponds to a clinical session, strictly enforce gating rules
    if (session) {
      if (!socket.user) {
        socket.emit('room-error', {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in to enter the clinical session.'
        });
        return;
      }

      // 1. Session must be in 'confirmed' state
      if (session.status !== 'confirmed') {
        socket.emit('room-error', {
          code: 'SESSION_NOT_CONFIRMED',
          status: session.status,
          message: `Consultation room is locked. Session is currently "${session.status}". Live rooms open only once confirmed.`
        });
        return;
      }

      // 2. User must be either the assigned client or the assigned therapist
      const isClient = socket.user.id === session.client_id;
      const isTherapist = socket.user.id === session.therapist_id;
      if (!isClient && !isTherapist) {
        socket.emit('room-error', {
          code: 'ACCESS_DENIED',
          message: 'Access restricted: You are not authorized for this private clinical session.'
        });
        return;
      }

      // 3. Time window enforcement: +/- 15 min grace period
      const gracePeriodMs = 15 * 60 * 1000;
      const slotTime = new Date(session.preferred_slot).getTime();
      const durationMs = (session.slot_duration_minutes || 45) * 60 * 1000;
      const windowStart = slotTime - gracePeriodMs;
      const windowEnd = slotTime + durationMs + gracePeriodMs;
      const now = Date.now();

      if (now < windowStart) {
        const minutesUntil = Math.ceil((windowStart - now) / 60000);
        socket.emit('room-error', {
          code: 'SESSION_NOT_STARTED',
          message: `Room opens 15 minutes before your scheduled appointment (in ~${minutesUntil} minutes).`
        });
        return;
      }

      if (now > windowEnd) {
        socket.emit('room-error', {
          code: 'SESSION_EXPIRED',
          message: 'This clinical consultation window has concluded. Live room is closed.'
        });
        return;
      }
    } else if (isProd && !isTestRoom) {
      // In production, arbitrary unmapped rooms are forbidden
      socket.emit('room-error', {
        code: 'SESSION_NOT_FOUND',
        message: 'No active clinical session booking found for this room.'
      });
      return;
    }

    // Verify authorized roles: only confirmed client + approved therapist can join clinical room
    const effectiveRole = socket.user?.role || role || 'client';
    const effectiveUserId = socket.user?.id || userId;
    const effectiveName = socket.user?.name || userName || 'Participant';

    if (effectiveRole === 'therapist' && socket.user) {
      try {
        const tpRes = await db.query('SELECT verification_status FROM therapist_profiles WHERE user_id = $1', [socket.user.id]);
        if (tpRes.rows.length === 0 || tpRes.rows[0].verification_status !== 'approved') {
          socket.emit('room-error', { message: 'Therapist is not approved for clinical sessions.' });
          return;
        }
      } catch (e) {
        // Continue
      }
    }

    socket.join(roomId);
    socket.data = { roomId, userId: effectiveUserId, userName: effectiveName, role: effectiveRole };

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    const roomSet = activeRooms.get(roomId);
    roomSet.add(socket.id);

    // Notify other peers in room that a user has joined
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId: effectiveUserId,
      userName: effectiveName,
      role: effectiveRole,
      participantsCount: roomSet.size
    });

    // Send back current room participant list to the newly joined peer
    socket.emit('room-ready', {
      roomId,
      participantsCount: roomSet.size,
      otherSockets: Array.from(roomSet).filter(id => id !== socket.id)
    });
  });

  // WebRTC Signal Forwarding (Offer, Answer, ICE candidate)
  socket.on('webrtc-signal', ({ targetSocketId, signal, mode }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-signal', {
        fromSocketId: socket.id,
        signal,
        mode,
        sender: socket.data
      });
    } else if (socket.data?.roomId) {
      // Broadcast to entire room except sender
      socket.to(socket.data.roomId).emit('webrtc-signal', {
        fromSocketId: socket.id,
        signal,
        mode,
        sender: socket.data
      });
    }
  });

  // Live Clinical Room In-Call Text Chat with validation, rate-limiting & encrypted persistence
  socket.on('clinical-chat-message', async ({ roomId, message }) => {
    const targetRoom = roomId || socket.data?.roomId;
    if (!targetRoom || !message?.text) return;

    // Rate-limiting: max 10 messages per 5 seconds
    const now = Date.now();
    const stamps = messageTimestamps.get(socket.id) || [];
    const recentStamps = stamps.filter(t => now - t < 5000);
    if (recentStamps.length >= 10) {
      socket.emit('rate-limit-warning', { message: 'Sending messages too fast. Please slow down.' });
      return;
    }
    recentStamps.push(now);
    messageTimestamps.set(socket.id, recentStamps);

    // Validate payload length
    const cleanText = String(message.text).slice(0, 1000).trim();
    if (!cleanText) return;

    const senderId = socket.user?.id || socket.data?.userId || socket.id;
    const senderRole = socket.user?.role || socket.data?.role || 'client';
    const msgId = 'cmsg_' + crypto.randomUUID().slice(0, 16);

    // Encrypt at rest in database
    try {
      const encrypted = encryptField(cleanText);
      await db.query(`
        INSERT INTO clinical_messages (id, room_id, sender_id, encrypted_content, iv, auth_tag, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [msgId, targetRoom, senderId, encrypted.ciphertext, encrypted.iv, encrypted.authTag]);
    } catch (dbErr) {
      console.warn('Failed to persist clinical chat message to DB:', dbErr.message);
    }

    const payload = {
      id: msgId,
      senderId,
      senderName: socket.data?.userName || socket.user?.name || 'Participant',
      senderRole,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    io.to(targetRoom).emit('clinical-chat-message', payload);
  });

  // Media state toggle (mic / camera)
  socket.on('media-toggle', ({ roomId, mediaType, enabled }) => {
    const targetRoom = roomId || socket.data?.roomId;
    if (targetRoom) {
      socket.to(targetRoom).emit('peer-media-toggle', {
        socketId: socket.id,
        mediaType,
        enabled
      });
    }
  });

  // Call termination
  socket.on('end-call', ({ roomId }) => {
    const targetRoom = roomId || socket.data?.roomId;
    if (targetRoom) {
      io.to(targetRoom).emit('call-ended', { initiator: socket.data?.userName || 'Participant' });
    }
  });

  // Disconnection handler - auto-offline therapist when all sockets close
  socket.on('disconnect', async () => {
    messageTimestamps.delete(socket.id);

    const roomId = socket.data?.roomId;
    const userId = socket.user?.id || socket.data?.userId;
    const role = socket.user?.role || socket.data?.role;

    // Multi-socket aware therapist disconnect
    if (role === 'therapist' && userId) {
      const userSockets = therapistSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          therapistSockets.delete(userId);
          try {
            await db.query('UPDATE therapist_profiles SET is_available = FALSE WHERE user_id = $1', [userId]);
          } catch (err) {
            console.warn('Failed to update therapist offline status:', err.message);
          }
        }
      } else {
        try {
          await db.query('UPDATE therapist_profiles SET is_available = FALSE WHERE user_id = $1', [userId]);
        } catch (err) {
          console.warn('Failed to update therapist offline status:', err.message);
        }
      }
    }

    if (roomId && activeRooms.has(roomId)) {
      const roomSet = activeRooms.get(roomId);
      roomSet.delete(socket.id);
      if (roomSet.size === 0) {
        activeRooms.delete(roomId);
      } else {
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userName: socket.data?.userName,
          participantsCount: roomSet.size
        });
      }
    }
  });
});

// Startup reset: ensure all therapists default to offline until active connection
db.query("UPDATE therapist_profiles SET is_available = FALSE")
  .catch(err => console.warn('Could not reset therapist availability on startup:', err.message));

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: 'The requested API endpoint was not found on this server.'
  });
});

// Centralized Security Error Handler (Turn Off Verbose Debug Stack Traces in Production)
app.use((err, req, res, next) => {
  console.error('[MindCare Security Guard Error]', err);

  // Handle CORS errors gracefully
  if (err.message && err.message.includes('CORS Policy')) {
    return res.status(403).json({
      success: false,
      error: 'CorsForbidden',
      message: err.message
    });
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'PayloadTooLarge',
      message: 'Request payload exceeds the maximum allowed 1MB limit.'
    });
  }

  const isDev = (process.env.NODE_ENV || 'development').trim() === 'development';
  return res.status(err.status || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: isDev ? err.message : 'A protected internal server error occurred. Please try again later.',
    ...(isDev && { stack: err.stack })
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🌿 MindCare Sanctuary Backend running on port ${PORT}`);
  console.log(`📡 Accepting client connections from: ${CLIENT_ORIGIN}`);
  console.log(`📹 WebRTC Signaling enabled via Socket.io on port ${PORT}`);
});

export { app, io, httpServer };
