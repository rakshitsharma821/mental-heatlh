// ============================================
// MindCare Backend — AI Companion Memory Controller (PostgreSQL)
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';

export const companionController = {
  saveMemory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { memory_type = 'short_term', summary_text, importance_weight = 0.5, ttl_days = 7 } = req.body;

      if (!summary_text || !summary_text.trim()) {
        return res.status(400).json({ success: false, message: 'Summary text is required.' });
      }

      const id = crypto.randomUUID();
      
      let expiresAt = null;
      if (memory_type === 'short_term') {
        const d = new Date();
        d.setDate(d.getDate() + ttl_days);
        expiresAt = d.toISOString();
      }

      await db.query(`
        INSERT INTO companion_memories (id, user_id, memory_type, summary_text, importance_weight, last_recalled_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      `, [id, userId, memory_type, summary_text.trim(), importance_weight, expiresAt]);

      // Proactive cleanup of expired short-term memories
      await db.query(`
        DELETE FROM companion_memories 
        WHERE user_id = $1 AND expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
      `, [userId]);

      return res.status(201).json({
        success: true,
        message: 'Companion memory retained in PostgreSQL.',
        memory: {
          id,
          memory_type,
          summary_text,
          expires_at: expiresAt
        }
      });
    } catch (err) {
      console.error('Save memory error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving companion memory.' });
    }
  },

  getMemories: async (req, res) => {
    try {
      const userId = req.user.id;

      // Auto-prune expired records
      await db.query(`
        DELETE FROM companion_memories 
        WHERE user_id = $1 AND expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
      `, [userId]);

      const result = await db.query(`
        SELECT id, memory_type, summary_text, importance_weight, last_recalled_at, created_at
        FROM companion_memories
        WHERE user_id = $1
        ORDER BY importance_weight DESC, created_at DESC
        LIMIT 20
      `, [userId]);

      return res.json({
        success: true,
        count: result.rows.length,
        memories: result.rows
      });
    } catch (err) {
      console.error('Get memories error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching companion memories.' });
    }
  },

  clearMemories: async (req, res) => {
    try {
      const userId = req.user.id;
      await db.query('DELETE FROM companion_memories WHERE user_id = $1', [userId]);

      return res.json({
        success: true,
        message: 'Companion memory reset. All previous conversation context cleared.'
      });
    } catch (err) {
      console.error('Clear memories error:', err);
      return res.status(500).json({ success: false, message: 'Server error clearing memories.' });
    }
  }
};
