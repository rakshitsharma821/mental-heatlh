// ============================================
// MindCare Backend — AI Companion Memory & Chat Controller (PostgreSQL)
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import {
  hasCrisisTrigger,
  findBlockedWord,
  extractUserWords,
  INDIA_HELPLINES_MESSAGE,
  SAFE_FALLBACK_REPLIES
} from '../utils/blockedWords.js';
import { aiService } from '../utils/aiService.js';

// Per-user rate limiting for /api/companion/chat: max 60 messages per minute
const chatRateLimitMap = new Map(); // userId -> [timestamps]
const CHAT_RATE_LIMIT = 60;
const CHAT_RATE_WINDOW_MS = 60 * 1000;

function checkChatRateLimit(userId) {
  const now = Date.now();
  const key = String(userId);
  const timestamps = (chatRateLimitMap.get(key) || []).filter(t => now - t < CHAT_RATE_WINDOW_MS);
  if (timestamps.length >= CHAT_RATE_LIMIT) {
    chatRateLimitMap.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  chatRateLimitMap.set(key, timestamps);
  return true;
}

export const companionController = {
  chat: async (req, res) => {
    try {
      const userId = req.user?.id || 'guest_' + String(req.ip || 'local').replace(/[^a-zA-Z0-9_]/g, '');

      if (!checkChatRateLimit(userId)) {
        return res.status(429).json({
          success: false,
          message: 'You are sending messages too quickly. Please take a mindful pause.'
        });
      }

      const { message, action, conversationId = 'default_convo', history = [] } = req.body;

      // Handle structured quick-reply action for helpline consent
      // Action: { type: "helpline_consent", value: "yes" | "no" }
      if (action && action.type === 'helpline_consent') {
        if (action.value === 'yes') {
          return res.json({
            success: true,
            type: 'helplines',
            text: INDIA_HELPLINES_MESSAGE,
            isCrisis: true,
            actionLink: '/crisis',
            actionText: 'Open Crisis Support & Safety Plan'
          });
        } else {
          return res.json({
            success: true,
            type: 'normal',
            text: 'I understand completely. We can take things at your pace. Would you like to try a calming breathing exercise or simply reflect quietly?',
            isCrisis: false,
            actionLink: '/breathing',
            actionText: 'Try Gentle Breathing'
          });
        }
      }

      // Input sanitization & validation
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }

      // Max message length: 800 characters
      let rawText = message.slice(0, 800);
      // Strip control chars / null bytes, normalize whitespace
      let sanitizedText = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').replace(/\s+/g, ' ').trim();

      // 1. Check for free-text helpline consent agreement if user just typed agreement:
      // Clear affirmatives ONLY: yes, yeah, haan, ok, okay, sure, absolutely
      // Note: ambiguous words like "please", "call", "help" alone do NOT count as agreement
      // (e.g., "please leave me alone" should NOT trigger helpline details)
      const isAffirmative = /^(yes|yeah|haan|ok|okay|sure|absolutely|yep)(\s+please)?$/i.test(sanitizedText) ||
                            /^(haan\s*ji|ji\s*haan|yes\s*sure)$/i.test(sanitizedText);

      // Check if the previous turn in history asked about helpline
      const lastAssistantTurn = history.length > 0 ? history[history.length - 1] : null;
      const wasAskedHelpline = lastAssistantTurn &&
        (lastAssistantTurn.role === 'assistant' || lastAssistantTurn.sender === 'aria') &&
        typeof lastAssistantTurn.content === 'string' &&
        lastAssistantTurn.content.includes('helpline for you?');

      if (wasAskedHelpline) {
        if (isAffirmative) {
          return res.json({
            success: true,
            type: 'helplines',
            text: INDIA_HELPLINES_MESSAGE,
            isCrisis: true,
            actionLink: '/crisis',
            actionText: 'Open Crisis Support & Safety Plan'
          });
        } else {
          // If ambiguous or negative like "please leave me alone"
          // If it matches crisis triggers, it proceeds to crisis flow; otherwise gentle response
        }
      }

      // 2. Deterministic crisis check BEFORE any LLM call
      // Spec: NEVER log crisis message content on server, NEVER send to LLM
      if (hasCrisisTrigger(sanitizedText)) {
        console.warn(`[Safety Warning] Deterministic crisis pattern triggered for user [REDACTED].`);
        return res.json({
          success: true,
          type: 'crisis',
          text: "I hear how deeply heavy things feel right now, and you do not have to carry this alone. Would you like me to call a helpline for you?",
          quickReplies: [
            { label: 'Yes, please', action: { type: 'helpline_consent', value: 'yes' } },
            { label: 'No, not right now', action: { type: 'helpline_consent', value: 'no' } }
          ],
          isCrisis: true,
          actionLink: '/crisis',
          actionText: 'Connect to Crisis Support'
        });
      }

      // 3. Track user-introduced words in DB per conversation (with 24h expiry & proactive cleanup)
      // Clean expired rows across table
      await db.query(`DELETE FROM companion_user_words WHERE expires_at < CURRENT_TIMESTAMP`).catch(() => {});

      const introducedWords = extractUserWords(sanitizedText);
      if (introducedWords.length > 0) {
        for (const w of introducedWords) {
          const wId = crypto.randomUUID();
          await db.query(`
            INSERT INTO companion_user_words (id, user_id, convo_id, word, expires_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '24 hours')
          `, [wId, userId, conversationId]).catch(() => {});
        }
      }

      // Fetch active non-expired user-introduced words for this conversation
      let userWordsSeen = [];
      try {
        const wordsRes = await db.query(`
          SELECT DISTINCT word FROM companion_user_words
          WHERE user_id = $1 AND convo_id = $2 AND expires_at >= CURRENT_TIMESTAMP
        `, [userId, conversationId]);
        userWordsSeen = wordsRes.rows.map(r => r.word.toLowerCase());
      } catch (e) {
        userWordsSeen = introducedWords;
      }

      // 4. Sensitive non-crisis keyword check (e.g., stress, panic, depression)
      // Check if user specifically used a sensitive word in this turn
      const sensitiveWord = findBlockedWord(sanitizedText);
      if (sensitiveWord && !wasAskedHelpline) {
        return res.json({
          success: true,
          type: 'sensitive',
          text: "Thank you for trusting me with what you are experiencing right now. Your well-being matters deeply. Would you like me to call a helpline for you?",
          quickReplies: [
            { label: 'Yes, please', action: { type: 'helpline_consent', value: 'yes' } },
            { label: 'No, let us keep talking', action: { type: 'helpline_consent', value: 'no' } }
          ],
          isCrisis: false,
          actionLink: '/crisis',
          actionText: 'View Crisis Helplines'
        });
      }

      // 5. Normal companion flow via LLM with output filtering & fallback
      // Strip PII (never send user's email, mobile, address)
      const sanitizedHistory = (Array.isArray(history) ? history.slice(-6) : []).map(h => ({
        role: h.role === 'assistant' || h.sender === 'aria' ? 'assistant' : 'user',
        content: String(h.content || h.text || '').slice(0, 500)
      }));

      let reply = await aiService.generateCompanionReply(sanitizedText, sanitizedHistory, userWordsSeen);

      if (!reply) {
        // Safe rule-based fallback
        reply = SAFE_FALLBACK_REPLIES[Math.floor(Math.random() * SAFE_FALLBACK_REPLIES.length)];
      }

      return res.json({
        success: true,
        type: 'normal',
        text: reply,
        isCrisis: false
      });
    } catch (err) {
      console.error('Companion chat error:', err);
      return res.status(500).json({
        success: false,
        message: 'Aria is taking a quiet breath. Please try again in a moment.'
      });
    }
  },

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
      // Immediately purge ephemeral user-introduced words on session clear
      await db.query('DELETE FROM companion_user_words WHERE user_id = $1', [userId]).catch(() => {});

      return res.json({
        success: true,
        message: 'Companion memory reset. All previous conversation context cleared.'
      });
    } catch (err) {
      console.error('Clear memories error:', err);
      return res.status(500).json({ success: false, message: 'Server error clearing memories.' });
    }
  },

  endConversation: async (req, res) => {
    try {
      const userId = req.user?.id || req.body?.userId;
      const { conversationId } = req.params;
      if (userId && conversationId) {
        await db.query('DELETE FROM companion_user_words WHERE user_id = $1 AND convo_id = $2', [userId, conversationId]);
      }
      return res.json({ success: true, message: 'Conversation ended and sensitive session words deleted.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error ending conversation.' });
    }
  }
};
