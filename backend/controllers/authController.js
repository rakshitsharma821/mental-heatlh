// ============================================
// MindCare Backend — Authentication Controller (PostgreSQL + scrypt + JWT)
// Uses standard RFC 4122 UUIDs for primary keys
// ============================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { hashPassword, generateSalt } from '../utils/crypto.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const RECOVERY_WORDS = [
  'cedar', 'willow', 'sage', 'river', 'stone', 'breeze', 'ember', 'dawn',
  'meadow', 'lotus', 'sprout', 'ocean', 'canopy', 'haven', 'silent', 'amber'
];

function generateRecoveryPhrase() {
  const chosen = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * RECOVERY_WORDS.length);
    chosen.push(RECOVERY_WORDS[idx]);
  }
  return chosen.join('-');
}

const lockouts = new Map(); // email -> { attempts, lockedUntil }

export const authController = {
  register: async (req, res) => {
    try {
      const { email, password, name, role = 'client' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = password || '';
      const cleanName = (name || '').trim();

      if (!cleanEmail || !cleanPassword || !cleanName) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      if (cleanPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }

      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'This email is already registered.' });
      }

      const userId = crypto.randomUUID();
      const salt = generateSalt();
      const passwordHash = hashPassword(cleanPassword, salt);
      const recoveryPhrase = generateRecoveryPhrase();
      const recoveryKeyHash = hashPassword(recoveryPhrase, salt);

      // Insert User
      await db.query(`
        INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, streak_count, mindfulness_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 10)
      `, [userId, cleanEmail, passwordHash, salt, recoveryKeyHash, cleanName, role]);

      // Initialize default therapy roadmap for user
      const defaultMilestones = JSON.stringify([
        { id: 'm1', title: 'Complete first 3-minute mindful breath', completed: false },
        { id: 'm2', title: 'Log first evening mood reflection', completed: false },
        { id: 'm3', title: 'Create first encrypted thought journal', completed: false },
        { id: 'm4', title: 'Establish 3-day mindfulness streak', completed: false },
        { id: 'm5', title: 'Explore 5-4-3-2-1 Sensory Grounding', completed: false }
      ]);
      await db.query(`
        INSERT INTO therapy_roadmaps (id, user_id, active_track, milestones_json, current_stage_index, progress_percentage)
        VALUES ($1, $2, 'Mindful Foundations', $3, 0, 0)
      `, [crypto.randomUUID(), userId, defaultMilestones]);

      // Initialize digital twin profile
      await db.query(`
        INSERT INTO digital_twin_profiles (id, user_id, stress_index, resilience_buffer, emotional_velocity)
        VALUES ($1, $2, 30, 70, 0.0)
      `, [crypto.randomUUID(), userId]);

      // Initialize inner world state
      await db.query(`
        INSERT INTO inner_world_states (id, user_id, tree_growth_stage, foliage_density, ambient_weather, firefly_warmth)
        VALUES ($1, $2, 0.25, 0.35, 'golden_hour', 0.65)
      `, [crypto.randomUUID(), userId]);

      // Generate JWT
      const token = jwt.sign(
        { id: userId, email: cleanEmail, name: cleanName, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully in PostgreSQL.',
        token,
        recoveryPhrase,
        user: {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          role,
          streak: 1,
          score: 10,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      // Check lockout
      const lockout = lockouts.get(cleanEmail);
      if (lockout && lockout.lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
        return res.status(429).json({
          success: false,
          locked: true,
          remainingSeconds,
          message: `Too many failed attempts. Account locked for ${remainingSeconds}s.`
        });
      }

      const result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = result.rows[0];

      // Verify password
      const calculatedHash = hashPassword(password || '', user.salt);
      if (calculatedHash !== user.password_hash) {
        const attempts = (lockout ? lockout.attempts : 0) + 1;
        if (attempts >= 5) {
          lockouts.set(cleanEmail, { attempts: 0, lockedUntil: Date.now() + 30000 });
          return res.status(429).json({
            success: false,
            locked: true,
            remainingSeconds: 30,
            message: 'Too many failed attempts. Account temporarily locked for 30s.'
          });
        } else {
          lockouts.set(cleanEmail, { attempts, lockedUntil: 0 });
          return res.status(401).json({
            success: false,
            remainingAttempts: 5 - attempts,
            message: `Invalid email or password. ${5 - attempts} attempts remaining.`
          });
        }
      }

      lockouts.delete(cleanEmail);

      await db.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.full_name, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const moodRes = await db.query(`
        SELECT mood_label, energy_level, valence_score, notes, logged_at
        FROM mood_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 20
      `, [user.id]);

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          streak: user.streak_count,
          score: user.mindfulness_score,
          createdAt: user.created_at,
          moodHistory: moodRes.rows
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  },

  me: async (req, res) => {
    try {
      const userRes = await db.query('SELECT id, email, full_name, role, streak_count, mindfulness_score, created_at FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = userRes.rows[0];
      const moodRes = await db.query(`
        SELECT mood_label, energy_level, valence_score, notes, logged_at
        FROM mood_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 30
      `, [user.id]);

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          streak: user.streak_count,
          score: user.mindfulness_score,
          createdAt: user.created_at,
          moodHistory: moodRes.rows
        }
      });
    } catch (err) {
      console.error('Get me error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
    }
  },

  recover: async (req, res) => {
    try {
      const { email, recoveryPhrase, newPassword } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !recoveryPhrase || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, recovery phrase, and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }

      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Account not found.' });
      }

      const user = userRes.rows[0];
      const cleanPhrase = recoveryPhrase.trim().toLowerCase();
      const enteredHash = hashPassword(cleanPhrase, user.salt);

      if (enteredHash !== user.recovery_key_hash) {
        return res.status(401).json({ success: false, message: 'Invalid recovery phrase.' });
      }

      const newSalt = generateSalt();
      const newPasswordHash = hashPassword(newPassword, newSalt);
      const newRecoveryPhrase = generateRecoveryPhrase();
      const newRecoveryKeyHash = hashPassword(newRecoveryPhrase, newSalt);

      await db.query(`
        UPDATE users
        SET password_hash = $1, salt = $2, recovery_key_hash = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newPasswordHash, newSalt, newRecoveryKeyHash, user.id]);

      lockouts.delete(cleanEmail);

      return res.json({
        success: true,
        message: 'Password reset successfully! Store your new recovery phrase.',
        newRecoveryPhrase
      });
    } catch (err) {
      console.error('Recovery error:', err);
      return res.status(500).json({ success: false, message: 'Server error during recovery.' });
    }
  },

  syncSession: async (req, res) => {
    try {
      const { email, name, role = 'client' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || 'Sanctuary Member').trim();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Email required for sync.' });
      }

      // Check if user exists in PostgreSQL
      let result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      let user;

      if (result.rows.length === 0) {
        // Auto-create user in PostgreSQL from existing session
        const userId = crypto.randomUUID();
        const salt = generateSalt();
        const fallbackPasswordHash = hashPassword('mindcare_sanctuary_synced_session', salt);
        const recoveryPhrase = generateRecoveryPhrase();
        const recoveryKeyHash = hashPassword(recoveryPhrase, salt);

        await db.query(`
          INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, streak_count, mindfulness_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 10)
        `, [userId, cleanEmail, fallbackPasswordHash, salt, recoveryKeyHash, cleanName, role]);

        // Default Roadmap
        const defaultMilestones = JSON.stringify([
          { id: 'm1', title: 'Complete first 3-minute mindful breath', completed: false },
          { id: 'm2', title: 'Log first evening mood reflection', completed: false },
          { id: 'm3', title: 'Create first encrypted thought journal', completed: false },
          { id: 'm4', title: 'Establish 3-day mindfulness streak', completed: false },
          { id: 'm5', title: 'Explore 5-4-3-2-1 Sensory Grounding', completed: false }
        ]);
        await db.query(`
          INSERT INTO therapy_roadmaps (id, user_id, active_track, milestones_json, current_stage_index, progress_percentage)
          VALUES ($1, $2, 'Mindful Foundations', $3, 0, 0)
        `, [crypto.randomUUID(), userId, defaultMilestones]);

        // Default Digital Twin
        await db.query(`
          INSERT INTO digital_twin_profiles (id, user_id, stress_index, resilience_buffer, emotional_velocity)
          VALUES ($1, $2, 30, 70, 0.0)
        `, [crypto.randomUUID(), userId]);

        // Default Inner World
        await db.query(`
          INSERT INTO inner_world_states (id, user_id, tree_growth_stage, foliage_density, ambient_weather, firefly_warmth)
          VALUES ($1, $2, 0.25, 0.35, 'golden_hour', 0.65)
        `, [crypto.randomUUID(), userId]);

        user = {
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          role,
          streak_count: 1,
          mindfulness_score: 10
        };
      } else {
        user = result.rows[0];
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.full_name, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: 'Session synchronized with PostgreSQL.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          streak: user.streak_count,
          score: user.mindfulness_score
        }
      });
    } catch (err) {
      console.error('Sync session error:', err);
      return res.status(500).json({ success: false, message: 'Server error syncing session.' });
    }
  }
};
