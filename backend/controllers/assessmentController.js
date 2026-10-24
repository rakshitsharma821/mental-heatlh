// ============================================
// MindCare Backend — Assessment & Questionnaire Controller
// Saves evidence-informed questionnaire outcomes & retrieves user history
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { aiService } from '../utils/aiService.js';
import { NotificationService } from '../utils/notificationService.js';

export const assessmentController = {
  startFocusMode: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await NotificationService.setServerFocusMode(userId, true);
      }
      return res.json({ success: true, message: 'Questionnaire focus mode active. All notifications silenced on server.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to activate focus mode.' });
    }
  },

  heartbeatFocusMode: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await NotificationService.setServerFocusMode(userId, true);
      }
      return res.json({ success: true, message: 'Questionnaire focus mode refreshed.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to refresh focus mode.' });
    }
  },

  endFocusMode: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await NotificationService.setServerFocusMode(userId, false);
      }
      return res.json({ success: true, message: 'Questionnaire focus mode deactivated.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to deactivate focus mode.' });
    }
  },

  getWelcomeMessage: async (req, res) => {
    try {
      // Name comes ONLY from the authenticated JWT/DB, never from query params or body
      let userName = req.user?.name || null;
      const userId = req.user?.id || null;

      if (!userName && userId) {
        const userRes = await db.query('SELECT full_name as name FROM users WHERE id = $1', [userId]);
        if (userRes.rows && userRes.rows.length > 0) {
          userName = userRes.rows[0].name;
        }
      }
      userName = userName || 'Friend';

      // If fresh requested (default), skip cache to generate a brand new message each time
      const forceFresh = req.query.fresh !== 'false';
      const sessionId = forceFresh ? null : (req.user?.iat ? String(req.user.iat) : (userId ? String(userId) : null));
      const result = await aiService.generateWelcomeMessage(userName, userId, sessionId);
      return res.json(result);
    } catch (err) {
      console.error('Welcome message generation error:', err);
      return res.json({
        success: true,
        message: 'Take a slow breath, then continue.',
        source: 'fallback'
      });
    }
  },

  saveAssessment: async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const { total_score, band, answers } = req.body;

      if (total_score === undefined || !band || !answers) {
        return res.status(400).json({ success: false, message: 'total_score, band, and answers are required.' });
      }

      const parsedScore = parseInt(total_score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 24) {
        return res.status(400).json({ success: false, message: 'total_score must be a valid integer between 0 and 24.' });
      }

      const validBands = ['low', 'moderate', 'high'];
      if (!validBands.includes(String(band).toLowerCase())) {
        return res.status(400).json({ success: false, message: 'band must be one of low, moderate, or high.' });
      }

      const id = crypto.randomUUID();

      await db.query(`
        INSERT INTO user_assessments (id, user_id, total_score, band, answers_json, completed_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [id, userId, parsedScore, String(band).toLowerCase(), JSON.stringify(answers)]);

      // If user is logged in, optionally increment mindfulness score and update stress index
      if (userId) {
        await NotificationService.setServerFocusMode(userId, false);
        await db.query(`
          UPDATE users
          SET mindfulness_score = mindfulness_score + 10, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [userId]).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: 'Assessment completed and securely recorded.',
        assessmentId: id
      });
    } catch (err) {
      console.error('Save assessment error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving assessment.' });
    }
  },

  getLatestAssessment: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const result = await db.query(`
        SELECT id, total_score, band, answers_json, completed_at
        FROM user_assessments
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return res.json({ success: true, assessment: null });
      }

      return res.json({
        success: true,
        assessment: result.rows[0]
      });
    } catch (err) {
      console.error('Get latest assessment error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching assessment.' });
    }
  }
};
