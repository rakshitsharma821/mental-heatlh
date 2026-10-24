// ============================================
// MindCare Backend — Authentication Controller (PostgreSQL + scrypt + JWT + Pluggable OTP)
// Multi-Role Portals: Client / Member, Therapist, Administrator
// ============================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { hashPassword, generateSalt } from '../utils/crypto.js';
import { otpService } from '../utils/otpService.js';
import { logAdminAction } from './adminController.js';
import { ROLES, USER_STATUS, AGE_LIMITS, AUTH_CONFIG, AUTH_MESSAGES } from '../config/constants.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing. A secure key must be provided.');
}
const JWT_EXPIRES_IN = AUTH_CONFIG.JWT_EXPIRES_IN;
const ADMIN_JWT_EXPIRES_IN = AUTH_CONFIG.ADMIN_JWT_EXPIRES_IN;

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

export function normalizeMobile(input) {
  if (!input) return null;
  const cleaned = String(input).trim().replace(/[\s\-()]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

export function hashOTP(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

// In-memory lockout map: identifier -> { attempts, lockedUntil }
const lockouts = new Map();

export const authController = {
  /**
   * Client / Member Registration (Age 20-25 strictly enforced; Location: city + state)
   */
  register: async (req, res) => {
    try {
      const { email, password, name, mobile_number, mobile, age, gender, address, city, state } = req.body;
      const role = ROLES.CLIENT; // Strictly enforce client role
      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicId = `MC-${randSuffix}`;

      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = password || '';
      const cleanName = (name || '').trim();
      const rawMobile = mobile_number || mobile || '';
      const cleanMobile = rawMobile ? normalizeMobile(rawMobile) : null;
      const cleanGender = (gender || '').trim();
      const cleanCity = (city || '').trim();
      const cleanState = (state || '').trim();
      const cleanAddress = (address || '').trim() || `${cleanCity}, ${cleanState}`.trim();
      const parsedAge = parseInt(age, 10);

      // Required fields
      if (!cleanEmail || !cleanPassword || !cleanName || !age || !cleanGender) {
        return res.status(400).json({
          success: false,
          message: 'All registration fields are required (Name, Email, Password, Age, Gender).'
        });
      }

      // Age constraint (strictly 20–25)
      if (isNaN(parsedAge) || parsedAge < AGE_LIMITS.MIN || parsedAge > AGE_LIMITS.MAX) {
        return res.status(400).json({
          success: false,
          message: AUTH_MESSAGES.AGE_RESTRICTION
        });
      }

      if (cleanPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }

      // Mobile format validation if provided
      if (cleanMobile && !/^\+\d{10,15}$/.test(cleanMobile)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit mobile number.'
        });
      }

      // Email uniqueness
      const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'This email is already registered.' });
      }

      if (cleanMobile) {
        const existingMobile = await db.query('SELECT id FROM users WHERE mobile_number = $1', [cleanMobile]);
        if (existingMobile.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'This mobile number is already registered.' });
        }
      }

      const userId = crypto.randomUUID();
      const salt = generateSalt();
      const passwordHash = hashPassword(cleanPassword, salt);
      const recoveryPhrase = generateRecoveryPhrase();
      const recoveryKeyHash = hashPassword(recoveryPhrase, salt);

      await db.query(`
        INSERT INTO users (
          id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status,
          mobile_number, age, gender, address, city, state, streak_count, mindfulness_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'client', 'active', $8, $9, $10, $11, $12, $13, 1, 10)
      `, [
        userId, publicId, cleanEmail, passwordHash, salt, recoveryKeyHash, cleanName,
        cleanMobile, parsedAge, cleanGender, cleanAddress || null, cleanCity || null, cleanState || null
      ]);

      // Initialize default therapy roadmap
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

      // Initialize digital twin profile & inner world state
      await db.query(`
        INSERT INTO digital_twin_profiles (id, user_id, stress_index, resilience_buffer, emotional_velocity)
        VALUES ($1, $2, 30, 70, 0.0)
      `, [crypto.randomUUID(), userId]);

      await db.query(`
        INSERT INTO inner_world_states (id, user_id, tree_growth_stage, foliage_density, ambient_weather, firefly_warmth)
        VALUES ($1, $2, 0.25, 0.35, 'golden_hour', 0.65)
      `, [crypto.randomUUID(), userId]);

      const token = jwt.sign(
        { id: userId, publicId, email: cleanEmail, name: cleanName, role: 'client' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully in MindCare Sanctuary.',
        token,
        recoveryPhrase,
        user: {
          id: userId,
          public_id: publicId,
          email: cleanEmail,
          name: cleanName,
          role: 'client',
          status: 'active',
          mobile_number: cleanMobile,
          age: parsedAge,
          gender: cleanGender,
          city: cleanCity,
          state: cleanState,
          address: cleanAddress,
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

  /**
   * Therapist Registration (Generates Therapist ID e.g. THR-XXXXXX, creates profile)
   */
  registerTherapist: async (req, res) => {
    try {
      const {
        email, password, name, title, license_number, licensing_board,
        specialties, bio, city, state, mobile_number, gender, therapist_type,
        skills_practised, education_entries, years_of_experience, languages,
        consultation_modes, consultation_fee, terms_accepted
      } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = password || '';
      const cleanName = (name || '').trim();
      const cleanLicense = (license_number || '').trim();
      const cleanBoard = (licensing_board || '').trim();
      const cleanTitle = (title || 'Licensed Clinical Psychologist').trim();

      if (!cleanEmail || !cleanPassword || !cleanName || !cleanLicense || !cleanBoard) {
        return res.status(400).json({
          success: false,
          message: 'All therapist registration fields are required (Name, Email, Password, License Number, Licensing Board).'
        });
      }

      if (cleanPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }

      // Check email uniqueness
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'This email is already registered.' });
      }

      // Check mobile uniqueness if provided
      if (mobile_number) {
        const mobExisting = await db.query('SELECT id FROM users WHERE mobile_number = $1', [mobile_number.trim()]);
        if (mobExisting.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'This mobile number is already registered.' });
        }
      }

      const userId = 'th_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicId = `THR-${randSuffix}`;

      const salt = generateSalt();
      const passwordHash = hashPassword(cleanPassword, salt);
      const recoveryKeyHash = hashPassword('mindcare-therapist-rec', salt);

      await db.query(`
        INSERT INTO users (
          id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status,
          mobile_number, city, state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'therapist', 'active', $8, $9, $10, CURRENT_TIMESTAMP)
      `, [
        userId, publicId, cleanEmail, passwordHash, salt, recoveryKeyHash, cleanName,
        mobile_number ? mobile_number.trim() : null, city || null, state || null
      ]);

      const parsedSpecialties = Array.isArray(specialties)
        ? specialties
        : ['Cognitive Behavioral Therapy (CBT)', 'Mindfulness Regulation', 'Anxiety Defusion'];

      const parsedSkills = Array.isArray(skills_practised)
        ? skills_practised
        : ['Cognitive Behavioral Therapy (CBT)'];

      const parsedEducation = Array.isArray(education_entries)
        ? education_entries
        : [];

      const parsedLanguages = Array.isArray(languages)
        ? languages
        : ['English'];

      const parsedModes = Array.isArray(consultation_modes)
        ? consultation_modes
        : ['chat', 'voice', 'video'];

      await db.query(`
        INSERT INTO therapist_profiles (
          id, user_id, license_number, licensing_board, specialties, bio, is_available,
          title, verification_status, is_demo, gender, city, state, therapist_type,
          skills_practised, education_entries, years_of_experience, languages,
          consultation_modes, consultation_fee, terms_accepted
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, FALSE,
          $7, 'documents_pending', FALSE, $8, $9, $10, $11,
          $12::jsonb, $13::jsonb, $14, $15::jsonb,
          $16::jsonb, $17, $18
        )
      `, [
        'tp_' + userId, userId, cleanLicense, cleanBoard,
        JSON.stringify(parsedSpecialties), bio || 'Clinical care provider at MindCare Sanctuary.',
        cleanTitle, gender || 'Not Specified', city || null, state || null,
        therapist_type || 'Clinical Psychologist',
        JSON.stringify(parsedSkills), JSON.stringify(parsedEducation),
        years_of_experience ? parseInt(years_of_experience, 10) : 0,
        JSON.stringify(parsedLanguages), JSON.stringify(parsedModes),
        consultation_fee ? parseInt(consultation_fee, 10) : 0,
        terms_accepted !== false
      ]);

      return res.status(201).json({
        success: true,
        message: 'Therapist registration submitted successfully. Your account is ready for document verification.',
        therapistId: publicId,
        user: {
          id: userId,
          public_id: publicId,
          email: cleanEmail,
          name: cleanName,
          role: 'therapist',
          status: 'active',
          verification_status: 'documents_pending'
        }
      });
    } catch (err) {
      console.error('registerTherapist error:', err);
      return res.status(500).json({ success: false, message: 'Server error during therapist registration.' });
    }
  },

  /**
   * Unified Multi-Portal Login:
   * 1. Member: Email or MC-XXXXXX User ID + Password
   * 2. Therapist: THR-XXXXXX Therapist ID + Email + Password (all 3 matching)
   * 3. Admin: ADM-XXXXXX Admin ID + Password + Confidential Access Code (salted hash match)
   */
  login: async (req, res) => {
    try {
      const { portal = 'member', identifier, email, password, accessCode, therapistId, adminId } = req.body;
      const cleanPassword = password || '';

      if (!cleanPassword) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }

      // ── THERAPIST PORTAL ──
      if (portal === 'therapist') {
        const tId = (therapistId || identifier || '').trim().toUpperCase();
        const tEmail = (email || (identifier && identifier.includes('@') ? identifier : '')).trim().toLowerCase();

        if (!tId || !tEmail) {
          return res.status(400).json({
            success: false,
            message: 'Therapist ID and registered email are both required.'
          });
        }

        const query = await db.query(
          "SELECT * FROM users WHERE public_id = $1 AND email = $2 AND role = 'therapist'",
          [tId, tEmail]
        );

        if (query.rows.length === 0) {
          return res.status(401).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
        }

        const user = query.rows[0];
        if (user.status && user.status !== 'active') {
          return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact support.` });
        }

        const calculatedHash = hashPassword(cleanPassword, user.salt);
        if (calculatedHash !== user.password_hash) {
          return res.status(401).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
        }

        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        const token = jwt.sign(
          { id: user.id, publicId: user.public_id, email: user.email, name: user.full_name, role: 'therapist' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            public_id: user.public_id,
            email: user.email,
            name: user.full_name,
            role: 'therapist',
            status: user.status
          }
        });
      }

      // ── ADMIN PORTAL ──
      if (portal === 'admin') {
        const aId = (adminId || identifier || '').trim().toUpperCase();
        const aCode = (accessCode || '').trim();

        if (!aId || !aCode) {
          return res.status(400).json({
            success: false,
            message: 'Admin ID and confidential access code are required.'
          });
        }

        // Check lockout
        const lockout = lockouts.get(aId);
        if (lockout && lockout.lockedUntil > Date.now()) {
          const remainingSeconds = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
          return res.status(429).json({
            success: false,
            locked: true,
            remainingSeconds,
            message: `Account temporarily locked due to failed attempts. Try again in ${remainingSeconds}s.`
          });
        }

        const query = await db.query(
          "SELECT * FROM users WHERE public_id = $1 AND role IN ('admin', 'super_admin')",
          [aId]
        );

        const failAdmin = async () => {
          const attempts = (lockout ? lockout.attempts : 0) + 1;
          if (attempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
            lockouts.set(aId, { attempts: 0, lockedUntil: Date.now() + AUTH_CONFIG.LOCKOUT_TIME_SECONDS * 1000 });
          } else {
            lockouts.set(aId, { attempts, lockedUntil: 0 });
          }
          await logAdminAction(aId, 'failed_admin_login', 'user', aId, 'Failed admin credentials attempt', req.ip);
          return res.status(401).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
        };

        if (query.rows.length === 0) {
          return await failAdmin();
        }

        const adminUser = query.rows[0];
        if (adminUser.status && adminUser.status !== 'active') {
          return res.status(403).json({ success: false, message: `Admin account is ${adminUser.status}.` });
        }

        // Verify password
        const calculatedPassHash = hashPassword(cleanPassword, adminUser.salt);
        if (calculatedPassHash !== adminUser.password_hash) {
          return await failAdmin();
        }

        // Verify access code hash
        if (!adminUser.access_code_hash || !adminUser.access_code_hash.includes(':')) {
          return await failAdmin();
        }

        const [codeSalt, expectedHash] = adminUser.access_code_hash.split(':');
        const calculatedCodeHash = hashPassword(aCode, codeSalt);
        try {
          const match = crypto.timingSafeEqual(Buffer.from(calculatedCodeHash), Buffer.from(expectedHash));
          if (!match) return await failAdmin();
        } catch (_) {
          return await failAdmin();
        }

        lockouts.delete(aId);

        if (AUTH_CONFIG.ADMIN_OTP_REQUIRED) {
          const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
          const otpHash = hashOTP(otpCode);
          const challengeId = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

          await db.query(`
            INSERT INTO user_otps (id, identifier, otp_hash, challenge_id, expires_at, attempts, verified)
            VALUES ($1, $2, $3, $4, $5, 0, FALSE)
          `, [crypto.randomUUID(), adminUser.email, otpHash, challengeId, expiresAt]);

          await otpService.send(adminUser.email, otpCode);

          return res.json({
            success: true,
            requiresOtp: true,
            challenge_id: challengeId,
            destination: adminUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            message: 'Admin OTP verification code sent.'
          });
        }

        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [adminUser.id]);

        const token = jwt.sign(
          { id: adminUser.id, publicId: adminUser.public_id, email: adminUser.email, name: adminUser.full_name, role: adminUser.role },
          JWT_SECRET,
          { expiresIn: ADMIN_JWT_EXPIRES_IN }
        );

        return res.json({
          success: true,
          token,
          must_change_password: Boolean(adminUser.must_change_password),
          must_change_access_code: Boolean(adminUser.must_change_access_code),
          user: {
            id: adminUser.id,
            public_id: adminUser.public_id,
            email: adminUser.email,
            name: adminUser.full_name,
            role: adminUser.role,
            status: adminUser.status
          }
        });
      }

      // ── MEMBER / CLIENT PORTAL (Default) ──
      const rawId = (identifier || email || '').trim();
      if (!rawId) {
        return res.status(400).json({ success: false, message: 'Please enter your email or User ID.' });
      }

      const isEmail = rawId.includes('@');
      const cleanId = rawId.toLowerCase();
      const normMobile = normalizeMobile(rawId);

      const query = await db.query(
        "SELECT * FROM users WHERE (email = $1 OR LOWER(public_id) = $1 OR mobile_number = $1 OR ($2::text IS NOT NULL AND mobile_number = $2)) AND role = 'client'",
        [cleanId, normMobile]
      );

      if (query.rows.length === 0) {
        return res.status(401).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
      }

      const clientUser = query.rows[0];
      if (clientUser.status && clientUser.status !== 'active') {
        return res.status(403).json({ success: false, message: `Account is ${clientUser.status}.` });
      }

      const calculatedHash = hashPassword(cleanPassword, clientUser.salt);
      if (calculatedHash !== clientUser.password_hash) {
        return res.status(401).json({ success: false, message: AUTH_MESSAGES.GENERIC_ERROR });
      }

      // If OTP required for clients (via env flag, mobile login, or x-require-otp header)
      const isMobileNumberInput = /^\+?\d{8,15}$/.test(rawId.replace(/[\s\-()]/g, ''));
      const isMobileLogin = isMobileNumberInput && Boolean(clientUser.mobile_number);
      const requiresOtp = process.env.CLIENT_OTP_REQUIRED === 'true' ||
                          AUTH_CONFIG.CLIENT_OTP_REQUIRED ||
                          req.headers['x-require-otp'] === 'true' ||
                          isMobileLogin;

      if (requiresOtp) {
        const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
        const otpHash = hashOTP(otpCode);
        const challengeId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

        const dispatchTarget = isMobileLogin && clientUser.mobile_number ? clientUser.mobile_number : clientUser.email;

        await db.query(`
          INSERT INTO user_otps (id, identifier, otp_hash, challenge_id, expires_at, attempts, verified)
          VALUES ($1, $2, $3, $4, $5, 0, FALSE)
        `, [crypto.randomUUID(), dispatchTarget, otpHash, challengeId, expiresAt]);

        await otpService.send(dispatchTarget, otpCode);

        const masked = isMobileLogin
          ? dispatchTarget.slice(0, 4) + '******' + dispatchTarget.slice(-2)
          : clientUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

        return res.json({
          success: true,
          requiresOtp: true,
          challenge_id: challengeId,
          destination: masked,
          message: `Verification code sent to ${masked}.`
        });
      }

      const token = jwt.sign(
        { id: clientUser.id, publicId: clientUser.public_id, email: clientUser.email, name: clientUser.full_name, role: 'client' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: clientUser.id,
          public_id: clientUser.public_id,
          email: clientUser.email,
          name: clientUser.full_name,
          role: 'client',
          status: clientUser.status,
          age: clientUser.age,
          gender: clientUser.gender,
          city: clientUser.city,
          state: clientUser.state
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  },

  /**
   * Request Email OTP for Recovery (Password / Therapist ID)
   * Super Admins must handle admin credentials; self-service admin recovery is disabled.
   */
  requestRecoveryOtp: async (req, res) => {
    try {
      const { email, role = 'client' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }

      if (role === 'admin' || role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: AUTH_MESSAGES.ADMIN_RECOVERY_FORBIDDEN
        });
      }

      const userRes = await db.query('SELECT id, public_id, email, full_name, role FROM users WHERE email = $1 AND role = $2', [cleanEmail, role]);
      if (userRes.rows.length === 0) {
        // Return generic success to avoid email enumeration
        return res.json({
          success: true,
          challenge_id: crypto.randomUUID(),
          message: 'If an account exists with this email, a verification code has been dispatched.'
        });
      }

      const user = userRes.rows[0];
      const otpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
      const otpHash = hashOTP(otpCode);
      const challengeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

      await db.query(`
        INSERT INTO user_otps (id, identifier, otp_hash, challenge_id, expires_at, attempts, verified)
        VALUES ($1, $2, $3, $4, $5, 0, FALSE)
      `, [crypto.randomUUID(), user.email, otpHash, challengeId, expiresAt]);

      await otpService.send(user.email, otpCode);

      const [local, domain] = user.email.split('@');
      const maskedEmail = `${local.charAt(0)}***@${domain}`;

      return res.json({
        success: true,
        challenge_id: challengeId,
        destination: maskedEmail,
        message: `Recovery code dispatched to ${maskedEmail}. Valid for ${AUTH_CONFIG.OTP_EXPIRY_MINUTES} minutes.`
      });
    } catch (err) {
      console.error('requestRecoveryOtp error:', err);
      return res.status(500).json({ success: false, message: 'Server error requesting recovery code.' });
    }
  },

  /**
   * Verify Recovery OTP
   */
  verifyRecoveryOtp: async (req, res) => {
    try {
      const { challenge_id, otp } = req.body;
      if (!challenge_id || !otp) {
        return res.status(400).json({ success: false, message: 'Challenge ID and OTP code are required.' });
      }

      const cleanOtp = String(otp).trim();
      const otpRes = await db.query('SELECT * FROM user_otps WHERE challenge_id = $1', [challenge_id]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired recovery session.' });
      }

      const challenge = otpRes.rows[0];
      if (new Date(challenge.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ success: false, message: 'Recovery code has expired.' });
      }

      if (challenge.attempts >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Maximum attempts exceeded.' });
      }

      const submittedHash = hashOTP(cleanOtp);
      if (submittedHash !== challenge.otp_hash) {
        await db.query('UPDATE user_otps SET attempts = attempts + 1 WHERE id = $1', [challenge.id]);
        return res.status(400).json({ success: false, message: 'Incorrect verification code.' });
      }

      await db.query('UPDATE user_otps SET verified = TRUE WHERE id = $1', [challenge.id]);

      const userRes = await db.query('SELECT id, public_id, email, full_name, role FROM users WHERE email = $1', [challenge.identifier]);
      const user = userRes.rows[0];

      return res.json({
        success: true,
        verified: true,
        role: user?.role || 'client',
        therapistId: user?.role === 'therapist' ? user.public_id : undefined,
        message: 'Recovery code verified successfully.'
      });
    } catch (err) {
      console.error('verifyRecoveryOtp error:', err);
      return res.status(500).json({ success: false, message: 'Server error verifying recovery code.' });
    }
  },

  /**
   * Complete Recovery: Reset Password and/or Update Therapist ID
   */
  completeRecovery: async (req, res) => {
    try {
      const { challenge_id, newPassword, newTherapistId } = req.body;
      if (!challenge_id) {
        return res.status(400).json({ success: false, message: 'Challenge ID is required.' });
      }

      const challengeRes = await db.query('SELECT * FROM user_otps WHERE challenge_id = $1 AND verified = TRUE', [challenge_id]);
      if (challengeRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Unauthorized or unverified recovery session.' });
      }

      const challenge = challengeRes.rows[0];
      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [challenge.identifier]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      const user = userRes.rows[0];

      if (user.role === 'admin' || user.role === 'super_admin') {
        return res.status(403).json({ success: false, message: AUTH_MESSAGES.ADMIN_RECOVERY_FORBIDDEN });
      }

      // If user is therapist and requests changing their Therapist ID
      if (newTherapistId && user.role === 'therapist') {
        const cleanTId = String(newTherapistId).trim().toUpperCase();
        if (!/^THR-[A-Z0-9]{4,10}$/.test(cleanTId)) {
          return res.status(400).json({
            success: false,
            message: 'Therapist ID must follow the format THR-XXXXXX (e.g. THR-8F92A1).'
          });
        }

        const existingTId = await db.query('SELECT id FROM users WHERE public_id = $1 AND id != $2', [cleanTId, user.id]);
        if (existingTId.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'This Therapist ID is already taken. Please choose another.' });
        }

        await db.query('UPDATE users SET public_id = $1 WHERE id = $2', [cleanTId, user.id]);
      }

      // If resetting password
      if (newPassword) {
        if (String(newPassword).length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }
        const newSalt = generateSalt();
        const newHash = hashPassword(newPassword, newSalt);
        await db.query('UPDATE users SET password_hash = $1, salt = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [newHash, newSalt, user.id]);
      }

      // Consume OTP
      await db.query('DELETE FROM user_otps WHERE id = $1', [challenge.id]);

      return res.json({
        success: true,
        message: 'Credentials updated successfully. You may now login.'
      });
    } catch (err) {
      console.error('completeRecovery error:', err);
      return res.status(500).json({ success: false, message: 'Server error completing recovery.' });
    }
  },

  /**
   * Verify OTP during Step 2 of 2FA login
   */
  verifyOtp: async (req, res) => {
    try {
      const { challenge_id, otp } = req.body;
      if (!challenge_id || !otp) {
        return res.status(400).json({ success: false, message: 'Challenge ID and 6-digit OTP code are required.' });
      }

      const cleanOtp = String(otp).trim();
      const otpQuery = await db.query('SELECT * FROM user_otps WHERE challenge_id = $1', [challenge_id]);

      if (otpQuery.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification session.' });
      }

      const challenge = otpQuery.rows[0];
      if (challenge.verified) {
        return res.status(400).json({ success: false, message: 'This code has already been verified.' });
      }

      if (new Date(challenge.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ success: false, expired: true, message: 'Verification code has expired. Please request a new code.' });
      }

      if (challenge.attempts >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Maximum verification attempts exceeded. Please request a new code.' });
      }

      const submittedHash = hashOTP(cleanOtp);
      if (submittedHash !== challenge.otp_hash) {
        const nextAttempts = challenge.attempts + 1;
        await db.query('UPDATE user_otps SET attempts = $1 WHERE id = $2', [nextAttempts, challenge.id]);
        return res.status(400).json({
          success: false,
          remainingAttempts: Math.max(0, 5 - nextAttempts),
          message: `Incorrect verification code. ${Math.max(0, 5 - nextAttempts)} attempts remaining.`
        });
      }

      await db.query('UPDATE user_otps SET verified = TRUE WHERE id = $1', [challenge.id]);

      const isEmail = challenge.identifier.includes('@');
      const userRes = await db.query(
        isEmail ? 'SELECT * FROM users WHERE email = $1' : 'SELECT * FROM users WHERE mobile_number = $1',
        [challenge.identifier]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Associated user account not found.' });
      }

      const user = userRes.rows[0];
      if (user.status && user.status !== 'active') {
        return res.status(403).json({ success: false, message: `Account is ${user.status}. Access denied.` });
      }

      await db.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { id: user.id, publicId: user.public_id, email: user.email, name: user.full_name, role: user.role },
        JWT_SECRET,
        { expiresIn: user.role === 'admin' || user.role === 'super_admin' ? ADMIN_JWT_EXPIRES_IN : JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: 'Verification successful. Welcome to MindCare Sanctuary.',
        token,
        user: {
          id: user.id,
          public_id: user.public_id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          status: user.status,
          must_change_password: Boolean(user.must_change_password),
          must_change_access_code: Boolean(user.must_change_access_code),
          mobile_number: user.mobile_number,
          age: user.age,
          gender: user.gender,
          city: user.city,
          state: user.state
        }
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
    }
  },

  resendOtp: async (req, res) => {
    try {
      const { challenge_id } = req.body;
      if (!challenge_id) {
        return res.status(400).json({ success: false, message: 'Challenge ID is required.' });
      }

      const challengeRes = await db.query('SELECT * FROM user_otps WHERE challenge_id = $1', [challenge_id]);
      if (challengeRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Verification session not found.' });
      }

      const oldChallenge = challengeRes.rows[0];
      const newOtpCode = Math.floor(100000 + crypto.randomInt(900000)).toString();
      const newOtpHash = hashOTP(newOtpCode);
      const newChallengeId = crypto.randomUUID();
      const newExpiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

      await db.query('DELETE FROM user_otps WHERE id = $1', [oldChallenge.id]);

      await db.query(`
        INSERT INTO user_otps (id, identifier, otp_hash, challenge_id, expires_at, attempts, verified)
        VALUES ($1, $2, $3, $4, $5, 0, FALSE)
      `, [crypto.randomUUID(), oldChallenge.identifier, newOtpHash, newChallengeId, newExpiresAt]);

      await otpService.send(oldChallenge.identifier, newOtpCode);

      return res.json({
        success: true,
        challenge_id: newChallengeId,
        message: 'New verification code dispatched.'
      });
    } catch (err) {
      console.error('Resend OTP error:', err);
      return res.status(500).json({ success: false, message: 'Server error resending OTP.' });
    }
  },

  me: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await db.query(
        'SELECT id, public_id, email, full_name, role, status, must_change_password, must_change_access_code, mobile_number, age, gender, address, city, state, streak_count, mindfulness_score, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = result.rows[0];
      return res.json({
        success: true,
        user: {
          id: user.id,
          public_id: user.public_id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          status: user.status,
          must_change_password: Boolean(user.must_change_password),
          must_change_access_code: Boolean(user.must_change_access_code),
          mobile_number: user.mobile_number,
          age: user.age,
          gender: user.gender,
          address: user.address,
          city: user.city,
          state: user.state,
          streak: user.streak_count,
          score: user.mindfulness_score,
          createdAt: user.created_at
        }
      });
    } catch (err) {
      console.error('Auth /me error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
    }
  },

  recover: async (req, res) => {
    try {
      const { email, recoveryPhrase, newPassword } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanRecoveryPhrase = (recoveryPhrase || '').trim();

      if (!cleanEmail || !cleanRecoveryPhrase || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, recovery phrase, and new password are required.' });
      }

      const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No account associated with this email.' });
      }

      const user = userRes.rows[0];
      const enteredPhraseHash = hashPassword(cleanRecoveryPhrase, user.salt);
      if (enteredPhraseHash !== user.recovery_key_hash) {
        return res.status(401).json({ success: false, message: 'Invalid recovery phrase.' });
      }

      const newSalt = generateSalt();
      const newPasswordHash = hashPassword(newPassword, newSalt);
      const newRecoveryKeyHash = hashPassword(cleanRecoveryPhrase, newSalt);

      await db.query(`
        UPDATE users
        SET password_hash = $1, salt = $2, recovery_key_hash = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newPasswordHash, newSalt, newRecoveryKeyHash, user.id]);

      return res.json({
        success: true,
        message: 'Password reset successfully. You may now log in with your new password.'
      });
    } catch (err) {
      console.error('Password recovery error:', err);
      return res.status(500).json({ success: false, message: 'Server error during password recovery.' });
    }
  },

  syncSession: async (req, res) => {
    try {
      const { email, name, role = 'client' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Email is required for session synchronization.' });
      }

      const existing = await db.query('SELECT id, email, full_name, role, public_id FROM users WHERE email = $1', [cleanEmail]);
      let user = null;

      if (existing.rows.length > 0) {
        user = existing.rows[0];
      } else {
        const userId = crypto.randomUUID();
        const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const publicId = `MC-${randSuffix}`;
        const salt = generateSalt();
        const dummyPasswordHash = hashPassword('mindcare_synced_session_' + Date.now(), salt);
        const recoveryPhrase = generateRecoveryPhrase();
        const recoveryKeyHash = hashPassword(recoveryPhrase, salt);

        await db.query(`
          INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, streak_count, mindfulness_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 10)
        `, [userId, publicId, cleanEmail, dummyPasswordHash, salt, recoveryKeyHash, cleanName || 'MindCare Guest', role]);

        user = { id: userId, public_id: publicId, email: cleanEmail, full_name: cleanName || 'MindCare Guest', role };
      }

      const token = jwt.sign(
        { id: user.id, publicId: user.public_id, email: user.email, name: user.full_name, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        token,
        user: { id: user.id, public_id: user.public_id, email: user.email, name: user.full_name, role: user.role }
      });
    } catch (err) {
      console.error('Session sync error:', err);
      return res.status(500).json({ success: false, message: 'Server error during session synchronization.' });
    }
  }
};
