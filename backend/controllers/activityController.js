// ============================================
// MindCare Backend — Activity & Exercise Controller (PostgreSQL)
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';

export const activityController = {
  logActivity: async (req, res) => {
    try {
      const userId = req.user.id;
      const { activity_type, duration_seconds = 180, completed = 1 } = req.body;

      if (!activity_type) {
        return res.status(400).json({ success: false, message: 'Activity type is required.' });
      }

      const id = crypto.randomUUID();
      await db.query(`
        INSERT INTO activity_logs (id, user_id, activity_type, duration_seconds, completed)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, userId, activity_type, duration_seconds, Boolean(completed)]);

      const pointsEarned = Math.max(5, Math.round(duration_seconds / 30) * 2);
      await db.query(`
        UPDATE users 
        SET mindfulness_score = mindfulness_score + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pointsEarned, userId]);

      // Update inner world tree growth slightly upon activity completion
      await db.query(`
        UPDATE inner_world_states
        SET tree_growth_stage = LEAST(1.0, tree_growth_stage + 0.02),
            foliage_density = LEAST(1.0, foliage_density + 0.03),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [userId]);

      return res.status(201).json({
        success: true,
        message: 'Activity recorded successfully.',
        pointsEarned,
        entry: {
          id,
          activity_type,
          duration_seconds,
          completed: Boolean(completed),
          created_at: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Log activity error:', err);
      return res.status(500).json({ success: false, message: 'Server error recording activity.' });
    }
  },

  getActivities: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 30;

      const result = await db.query(`
        SELECT id, activity_type, duration_seconds, completed, created_at
        FROM activity_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      const totalResult = await db.query(`
        SELECT SUM(duration_seconds) as total_seconds
        FROM activity_logs
        WHERE user_id = $1
      `, [userId]);

      const totalSeconds = totalResult.rows[0]?.total_seconds || 0;

      return res.json({
        success: true,
        totalCompletedMinutes: Math.round(totalSeconds / 60),
        activities: result.rows
      });
    } catch (err) {
      console.error('Get activities error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving activities.' });
    }
  }
};
