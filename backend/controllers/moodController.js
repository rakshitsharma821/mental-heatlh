// ============================================
// MindCare Backend — Mood Tracking Controller (PostgreSQL)
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';

export const moodController = {
  logMood: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
      const { mood_label, energy_level = 3, valence_score = 0.0, notes = '' } = req.body;

      if (!mood_label) {
        return res.status(400).json({ success: false, message: 'Mood label is required.' });
      }

      if (!userId) {
        return res.json({
          success: true,
          offline: true,
          message: 'Mood saved to local sanctuary.'
        });
      }

      const id = crypto.randomUUID();
      await db.query(`
        INSERT INTO mood_logs (id, user_id, mood_label, energy_level, valence_score, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, userId, mood_label, energy_level, valence_score, notes]);

      // Increment user mindfulness score
      await db.query(`
        UPDATE users 
        SET mindfulness_score = mindfulness_score + 5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      return res.status(201).json({
        success: true,
        message: 'Mood logged successfully.',
        entry: {
          id,
          mood_label,
          energy_level,
          valence_score,
          notes,
          logged_at: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Log mood error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving mood log.' });
    }
  },

  getHistory: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.json({
          success: true,
          count: 0,
          moods: []
        });
      }
      const limit = parseInt(req.query.limit, 10) || 50;

      const result = await db.query(`
        SELECT id, mood_label, energy_level, valence_score, notes, logged_at
        FROM mood_logs
        WHERE user_id = $1
        ORDER BY logged_at DESC
        LIMIT $2
      `, [userId, limit]);

      return res.json({
        success: true,
        count: result.rows.length,
        moods: result.rows
      });
    } catch (err) {
      console.error('Get mood history error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching mood history.' });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.json({
          success: true,
          totalLogged: 0,
          averageEnergy: 3.0,
          averageValence: 0.0,
          dominantMood: 'calm',
          trend: 'stable'
        });
      }

      const result = await db.query(`
        SELECT mood_label, energy_level, valence_score, logged_at
        FROM mood_logs
        WHERE user_id = $1
        ORDER BY logged_at DESC
        LIMIT 14
      `, [userId]);

      const recentMoods = result.rows;
      if (recentMoods.length === 0) {
        return res.json({
          success: true,
          totalLogged: 0,
          averageEnergy: 3.0,
          averageValence: 0.0,
          dominantMood: 'calm',
          trend: 'stable'
        });
      }

      const totalEnergy = recentMoods.reduce((sum, m) => sum + (Number(m.energy_level) || 3), 0);
      const totalValence = recentMoods.reduce((sum, m) => sum + (parseFloat(m.valence_score) || 0), 0);

      const counts = {};
      recentMoods.forEach(m => {
        counts[m.mood_label] = (counts[m.mood_label] || 0) + 1;
      });
      const dominantMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

      return res.json({
        success: true,
        totalLogged: recentMoods.length,
        averageEnergy: Number((totalEnergy / recentMoods.length).toFixed(1)),
        averageValence: Number((totalValence / recentMoods.length).toFixed(2)),
        dominantMood,
        trend: totalValence >= 0 ? 'positive' : 'reflective'
      });
    } catch (err) {
      console.error('Mood analytics error:', err);
      return res.status(500).json({ success: false, message: 'Server error computing analytics.' });
    }
  }
};
