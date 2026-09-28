// ============================================
// MindCare Backend — Encrypted Journal Controller (PostgreSQL)
// AES-256-GCM Field-Level Encryption at Rest
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { encryptField, decryptField } from '../utils/crypto.js';

function analyzeDistortion(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('always') || lower.includes('never') || lower.includes('everyone') || lower.includes('no one')) {
    return 'All-or-Nothing Thinking';
  }
  if (lower.includes('disaster') || lower.includes('ruined') || lower.includes('worst') || lower.includes('terrible')) {
    return 'Catastrophizing';
  }
  if (lower.includes('should') || lower.includes('must') || lower.includes('ought to')) {
    return 'Should Statements';
  }
  if (lower.includes('my fault') || lower.includes('blame myself')) {
    return 'Personalization';
  }
  return 'Balanced Reflection';
}

function analyzeTheme(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('insomnia')) return 'Sleep & Rest';
  if (lower.includes('work') || lower.includes('boss') || lower.includes('deadline')) return 'Career & Work';
  if (lower.includes('family') || lower.includes('friend') || lower.includes('relationship')) return 'Relationships';
  if (lower.includes('grateful') || lower.includes('thankful') || lower.includes('blessed')) return 'Gratitude';
  if (lower.includes('anxious') || lower.includes('panic') || lower.includes('nervous')) return 'Anxiety';
  return 'General Wellness';
}

export const journalController = {
  createEntry: async (req, res) => {
    try {
      const userId = req.user.id;
      const { content, sentiment_tag } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Journal content cannot be empty.' });
      }

      const id = crypto.randomUUID();
      const tag = sentiment_tag || analyzeTheme(content);
      const distortion = analyzeDistortion(content);

      // Encrypt sensitive content using AES-256-GCM
      const { ciphertext, iv, authTag } = encryptField(content);

      await db.query(`
        INSERT INTO journal_entries (id, user_id, encrypted_content, iv, auth_tag, sentiment_tag, cognitive_distortion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, userId, ciphertext, iv, authTag, tag, distortion]);

      await db.query(`
        UPDATE users 
        SET mindfulness_score = mindfulness_score + 10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      return res.status(201).json({
        success: true,
        message: 'Journal entry encrypted and safely stored in PostgreSQL.',
        entry: {
          id,
          sentiment_tag: tag,
          cognitive_distortion: distortion,
          created_at: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Create journal entry error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving journal entry.' });
    }
  },

  getEntries: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 30;

      const result = await db.query(`
        SELECT id, encrypted_content, iv, auth_tag, sentiment_tag, cognitive_distortion, created_at
        FROM journal_entries
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      // Decrypt each entry on the fly for the client
      const entries = result.rows.map(row => {
        const decryptedContent = decryptField(row.encrypted_content, row.iv, row.auth_tag);
        return {
          id: row.id,
          content: decryptedContent,
          sentiment_tag: row.sentiment_tag,
          cognitive_distortion: row.cognitive_distortion,
          created_at: row.created_at
        };
      });

      return res.json({
        success: true,
        count: entries.length,
        entries
      });
    } catch (err) {
      console.error('Get journal entries error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving journal entries.' });
    }
  },

  deleteEntry: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await db.query('DELETE FROM journal_entries WHERE id = $1 AND user_id = $2', [id, userId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Entry not found or unauthorized.' });
      }

      return res.json({ success: true, message: 'Journal entry securely erased.' });
    } catch (err) {
      console.error('Delete journal error:', err);
      return res.status(500).json({ success: false, message: 'Server error deleting entry.' });
    }
  }
};
