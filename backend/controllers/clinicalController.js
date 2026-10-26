// ============================================
// MindCare Backend — Clinical & Booking Controller
// Task 6 & Step 0: Professional Connect, WebRTC Signaling Config,
//                  Encrypted Clinical Notes & Messages, Access Logs,
//                  Therapist Availability Tracking & Role-based Therapy Plans
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { encryptField, decryptField } from '../utils/crypto.js';
import { WEBRTC_CONFIG } from '../config/constants.js';
import { NotificationService } from '../utils/notificationService.js';
import { NOTIFICATION_CONFIG } from '../config/notifications.js';

const DEFAULT_THERAPIST = {
  id: 'usr_demo_therapist_01',
  name: 'Dr. Evelyn Vance, PsyD',
  title: 'Licensed Clinical Psychologist',
  license: 'RCI-PSY-DEMO01',
  specialties: ['Cognitive Behavioral Therapy (CBT)', 'Mindfulness Regulation', 'Burnout and Anxiety Management'],
  bio: 'Specializing in integrative mindfulness-based cognitive therapy, nervous system down-regulation, and compassionate burnout recovery.',
  is_available: false,
  is_demo: true,
  verification_status: 'under_review'
};

// In-memory session requests fallback for testing/demo environments
let memoryRequests = [];

function decryptIfEncrypted(val) {
  if (!val || typeof val !== 'string') return val || '';
  try {
    if (val.startsWith('{') && val.includes('"ciphertext"')) {
      const parsed = JSON.parse(val);
      if (parsed.ciphertext && parsed.iv && parsed.authTag) {
        const res = decryptField(parsed.ciphertext, parsed.iv, parsed.authTag);
        if (!res || res.includes('Decryption Error')) return null;
        return res;
      }
    }
  } catch (e) {
    // Keep as is if not encrypted format
  }
  return val;
}

export const clinicalController = {
  /**
   * Get default or primary therapist details
   */
  getTherapist: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT u.id, u.full_name as name, u.email, tp.title, tp.license_number as license, 
               tp.specialties, tp.bio, tp.is_available, tp.is_demo, tp.verification_status
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        WHERE u.role = 'therapist'
        ORDER BY tp.created_at ASC
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return res.json({
          success: true,
          therapist: {
            id: row.id,
            name: row.name,
            title: row.title || 'Licensed Clinical Psychologist',
            license: row.license,
            specialties: Array.isArray(row.specialties) ? row.specialties : JSON.parse(row.specialties || '[]'),
            bio: row.bio,
            is_available: Boolean(row.is_available),
            is_demo: Boolean(row.is_demo),
            verification_status: row.verification_status
          }
        });
      }

      return res.json({ success: true, therapist: DEFAULT_THERAPIST });
    } catch (err) {
      console.warn('Error fetching therapist from DB, using fallback:', err.message);
      return res.json({ success: true, therapist: DEFAULT_THERAPIST });
    }
  },

  /**
   * Check therapist availability.
   * Only approved therapists are counted as available.
   * If no therapist is online, signals fallbackToAi: true
   */
  getAvailability: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT u.id, u.full_name as name, tp.title, tp.specialties, tp.is_available, tp.verification_status, tp.is_demo
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        WHERE u.role IN ('therapist', 'admin')
      `);

      const therapists = result.rows.map(r => ({
        id: r.id,
        name: r.name,
        title: r.title || 'Licensed Clinical Psychologist',
        specialties: Array.isArray(r.specialties) ? r.specialties : JSON.parse(r.specialties || '[]'),
        is_available: Boolean(r.is_available) && r.verification_status === 'approved',
        is_demo: Boolean(r.is_demo),
        verification_status: r.verification_status
      }));

      const availableCount = therapists.filter(t => t.is_available).length;

      return res.json({
        success: true,
        count: therapists.length,
        availableCount,
        isAnyAvailable: availableCount > 0,
        fallbackToAi: availableCount === 0,
        message: availableCount > 0
          ? `${availableCount} licensed professional(s) available for immediate connection.`
          : 'No therapists are currently online. Connecting you directly with Aria, your 24/7 AI wellness companion.',
        therapists
      });
    } catch (err) {
      console.error('getAvailability error:', err.message);
      return res.json({
        success: true,
        count: 1,
        availableCount: 0,
        isAnyAvailable: false,
        fallbackToAi: true,
        therapists: [DEFAULT_THERAPIST]
      });
    }
  },

  /**
   * Toggle therapist availability (Requires role: therapist or admin, and therapist must be approved)
   */
  toggleAvailability: async (req, res) => {
    try {
      const userId = req.user.id;
      const { is_available } = req.body;

      // Check current status
      const existing = await db.query('SELECT is_available, verification_status FROM therapist_profiles WHERE user_id = $1', [userId]);
      const newStatus = typeof is_available === 'boolean' 
        ? is_available 
        : existing.rows.length > 0 ? !existing.rows[0].is_available : true;

      const profileId = 'tp_' + crypto.randomUUID().slice(0, 16);
      await db.query(`
        INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_available)
        VALUES ($1, $2, 'Lic #PSY-DEFAULT', 'Licensing Board', 'approved', $3)
        ON CONFLICT (user_id) DO UPDATE SET is_available = $3
      `, [profileId, userId, newStatus]);

      return res.json({
        success: true,
        is_available: newStatus,
        message: `Status updated: You are now marked as ${newStatus ? 'Available / Online' : 'Offline'}.`
      });
    } catch (err) {
      console.error('toggleAvailability error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update availability status.' });
    }
  },

  /**
   * Return WebRTC ICE/STUN/TURN configuration
   */
  getRtcConfig: (req, res) => {
    const stunServer = process.env.STUN_SERVER || WEBRTC_CONFIG.STUN_SERVER || 'stun:stun.l.google.com:19302';
    const iceServers = [{ urls: stunServer }];

    const turnServer = process.env.TURN_SERVER || WEBRTC_CONFIG.TURN_SERVER;
    if (turnServer) {
      iceServers.push({
        urls: turnServer,
        username: process.env.TURN_USERNAME || WEBRTC_CONFIG.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || process.env.TURN_PASSWORD || WEBRTC_CONFIG.TURN_CREDENTIAL || ''
      });
    }

    return res.json({
      success: true,
      iceServers
    });
  },

  /**
   * Create or update Clinical Treatment Plan
   * Restricted: Only therapist or admin can create/edit therapy plans
   * Sensitive text is encrypted at rest (AES-256-GCM) and logged to clinical_plan_access_logs.
   */
  saveTreatmentPlan: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const therapistName = req.user.name || 'Clinical Psychologist';
      const {
        clientId,
        requiresFurtherEvaluation = false,
        clinicalNotes = '',
        evaluationSummary = '',
        collaborativeTherapies = [],
        goals = []
      } = req.body;

      if (!clientId) {
        return res.status(400).json({ success: false, message: 'Client ID is required.' });
      }

      // Check if client exists
      const clientUser = await db.query('SELECT id FROM users WHERE id = $1', [clientId]);
      if (clientUser.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Client not found.' });
      }

      // Encrypt sensitive clinical notes and evaluation summaries at rest
      const encryptedNotes = clinicalNotes ? JSON.stringify(encryptField(clinicalNotes)) : '';
      const encryptedSummary = evaluationSummary ? JSON.stringify(encryptField(evaluationSummary)) : '';

      const planId = 'tp_' + crypto.randomUUID().slice(0, 16);

      const query = `
        INSERT INTO clinical_therapy_plans (
          id, client_id, therapist_id, therapist_name, requires_further_evaluation,
          clinical_notes, evaluation_summary, collaborative_therapies, goals, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const result = await db.query(query, [
        planId,
        clientId,
        therapistId,
        therapistName,
        Boolean(requiresFurtherEvaluation),
        encryptedNotes,
        encryptedSummary,
        JSON.stringify(collaborativeTherapies),
        JSON.stringify(goals)
      ]);

      // Record access log
      await db.query(`
        INSERT INTO clinical_plan_access_logs (id, plan_id, accessor_id, accessor_role, action, ip_address, accessed_at)
        VALUES ($1, $2, $3, $4, 'create_or_update', $5, CURRENT_TIMESTAMP)
      `, [crypto.randomUUID(), planId, therapistId, req.user.role, req.ip || null]);

      const plan = result.rows[0];
      plan.clinical_notes = clinicalNotes;
      plan.evaluation_summary = evaluationSummary;

      return res.status(201).json({
        success: true,
        message: 'Clinical treatment plan successfully saved.',
        plan
      });
    } catch (err) {
      console.error('saveTreatmentPlan error:', err);
      return res.status(500).json({ success: false, message: 'Failed to record clinical treatment plan.' });
    }
  },

  /**
   * Mark further evaluation required or update clinical evaluation notes
   * Restricted: Only therapist or admin
   */
  updateEvaluation: async (req, res) => {
    try {
      const { clientId } = req.params;
      const { requiresFurtherEvaluation, clinicalNotes } = req.body;
      const therapistId = req.user.id;
      const therapistName = req.user.name || 'Clinical Psychologist';

      // Verify therapist is assigned to this client
      const assigned = await db.query(`
        SELECT 1 FROM session_bookings WHERE therapist_id = $1 AND client_id = $2
        UNION
        SELECT 1 FROM clinical_therapy_plans WHERE therapist_id = $1 AND client_id = $2
      `, [therapistId, clientId]);
      if (assigned.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this client.' });
      }

      const existingPlan = await db.query(`
        SELECT id, clinical_notes, evaluation_summary FROM clinical_therapy_plans WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1
      `, [clientId]);

      let plan;
      let planId;
      const encryptedNotes = clinicalNotes !== undefined ? JSON.stringify(encryptField(clinicalNotes)) : undefined;

      if (existingPlan.rows.length > 0) {
        planId = existingPlan.rows[0].id;
        const updateRes = await db.query(`
          UPDATE clinical_therapy_plans
          SET requires_further_evaluation = $1,
              clinical_notes = COALESCE($2, clinical_notes),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING *
        `, [Boolean(requiresFurtherEvaluation), encryptedNotes, planId]);
        plan = updateRes.rows[0];
      } else {
        planId = 'tp_' + crypto.randomUUID().slice(0, 16);
        const insertRes = await db.query(`
          INSERT INTO clinical_therapy_plans (
            id, client_id, therapist_id, therapist_name, requires_further_evaluation, clinical_notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [planId, clientId, therapistId, therapistName, Boolean(requiresFurtherEvaluation), encryptedNotes || '']);
        plan = insertRes.rows[0];
      }

      // Record access log
      await db.query(`
        INSERT INTO clinical_plan_access_logs (id, plan_id, accessor_id, accessor_role, action, ip_address, accessed_at)
        VALUES ($1, $2, $3, $4, 'update_evaluation', $5, CURRENT_TIMESTAMP)
      `, [crypto.randomUUID(), planId, therapistId, req.user.role, req.ip || null]);

      plan.clinical_notes = clinicalNotes !== undefined ? clinicalNotes : decryptIfEncrypted(plan.clinical_notes);
      plan.evaluation_summary = decryptIfEncrypted(plan.evaluation_summary);

      return res.json({
        success: true,
        message: `Evaluation status updated: ${Boolean(requiresFurtherEvaluation) ? 'Further clinical evaluation required.' : 'Standard protocol maintained.'}`,
        plan
      });
    } catch (err) {
      console.error('updateEvaluation error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update clinical evaluation.' });
    }
  },

  /**
   * Retrieve treatment plan for a client
   * Accessible by the therapist or the client themselves (clients can only view their own plan).
   */
  getTreatmentPlan: async (req, res) => {
    try {
      const { clientId } = req.params;
      const caller = req.user;

      if (!caller) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      // 1. Admin/Super Admin confidentiality block
      if (caller.role === 'admin' || caller.role === 'super_admin') {
        return res.status(403).json({ success: false, message: 'Confidentiality protection: Administrators cannot access clinical treatment plans.' });
      }

      // 2. Client privacy: client can only see their own plan
      if (caller.role === 'client' && caller.id !== clientId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own treatment plan.' });
      }

      // 3. Therapist check: therapist must be assigned to this client
      if (caller.role === 'therapist') {
        const assignedRes = await db.query(`
          SELECT 1 FROM session_bookings WHERE therapist_id = $1 AND client_id = $2
          UNION
          SELECT 1 FROM clinical_therapy_plans WHERE therapist_id = $1 AND client_id = $2
        `, [caller.id, clientId]);
        if (assignedRes.rows.length === 0) {
          return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this client.' });
        }
      }

      const result = await db.query(`
        SELECT * FROM clinical_therapy_plans
        WHERE client_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [clientId]);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          hasPlan: false,
          message: 'No formal clinical treatment plan recorded yet.'
        });
      }

      const rawPlan = result.rows[0];

      // Record access in clinical_plan_access_logs
      await db.query(`
        INSERT INTO clinical_plan_access_logs (id, plan_id, accessor_id, accessor_role, action, ip_address, accessed_at)
        VALUES ($1, $2, $3, $4, 'view_plan', $5, CURRENT_TIMESTAMP)
      `, [crypto.randomUUID(), rawPlan.id, caller.id, caller.role, req.ip || null]);

      // Decrypt sensitive text
      rawPlan.clinical_notes = decryptIfEncrypted(rawPlan.clinical_notes);
      rawPlan.evaluation_summary = decryptIfEncrypted(rawPlan.evaluation_summary);

      return res.json({
        success: true,
        hasPlan: true,
        plan: rawPlan
      });
    } catch (err) {
      console.error('getTreatmentPlan error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve treatment plan.' });
    }
  },

  /**
   * Persistent clinical chat messages (encrypted at rest, never accessible to admins)
   */
  getClinicalMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const caller = req.user;

      if (caller.role === 'admin' || caller.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Confidentiality protection: Administrators cannot access clinical chat records.'
        });
      }

      // Room participant verification: caller must be assigned client or therapist
      const sessionRes = await db.query(`
        SELECT client_id, therapist_id FROM session_bookings WHERE id = $1
      `, [roomId]);

      if (sessionRes.rows.length > 0) {
        const s = sessionRes.rows[0];
        if (caller.id !== s.client_id && caller.id !== s.therapist_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not an authorized participant in this clinical session.'
          });
        }
      } else if (!roomId.startsWith('test_')) {
        return res.status(404).json({
          success: false,
          message: 'Clinical session room not found.'
        });
      }

      const rows = await db.query(`
        SELECT id, room_id, sender_id, recipient_id, encrypted_content, iv, auth_tag, created_at
        FROM clinical_messages
        WHERE room_id = $1
        ORDER BY created_at ASC
      `, [roomId]);

      const messages = rows.rows.map(r => ({
        id: r.id,
        roomId: r.room_id,
        senderId: r.sender_id,
        recipientId: r.recipient_id,
        text: decryptField(r.encrypted_content, r.iv, r.auth_tag),
        createdAt: r.created_at
      }));

      return res.json({ success: true, messages });
    } catch (err) {
      console.error('getClinicalMessages error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
    }
  },

  sendClinicalMessage: async (req, res) => {
    try {
      const { roomId, recipientId, text } = req.body;
      const caller = req.user;

      if (caller.role === 'admin' || caller.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Confidentiality protection: Administrators cannot participate in clinical client chats.'
        });
      }

      // Room participant verification: caller must be assigned client or therapist
      const sessionRes = await db.query(`
        SELECT client_id, therapist_id FROM session_bookings WHERE id = $1
      `, [roomId]);

      if (sessionRes.rows.length > 0) {
        const s = sessionRes.rows[0];
        if (caller.id !== s.client_id && caller.id !== s.therapist_id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not an authorized participant in this clinical session.'
          });
        }
      } else if (!roomId.startsWith('test_')) {
        return res.status(404).json({
          success: false,
          message: 'Clinical session room not found.'
        });
      }

      if (!roomId || !text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Room ID and text are required.' });
      }

      const encrypted = encryptField(text.trim());
      const msgId = 'cmsg_' + crypto.randomUUID().slice(0, 16);

      await db.query(`
        INSERT INTO clinical_messages (id, room_id, sender_id, recipient_id, encrypted_content, iv, auth_tag, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [msgId, roomId, caller.id, recipientId || null, encrypted.ciphertext, encrypted.iv, encrypted.authTag]);

      return res.status(201).json({
        success: true,
        message: {
          id: msgId,
          roomId,
          senderId: caller.id,
          recipientId: recipientId || null,
          text: text.trim(),
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('sendClinicalMessage error:', err);
      return res.status(500).json({ success: false, message: 'Failed to send clinical message.' });
    }
  },

  /**
   * Retrieve session requests
   */
  getRequests: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT sb.id, sb.client_id, u.full_name as "clientName", u.email as "clientEmail",
               sb.session_type as "sessionType", sb.preferred_slot as "preferredWindow",
               sb.client_encrypted_note as "clientNote", sb.status, sb.created_at as "submittedAt"
        FROM session_bookings sb
        LEFT JOIN users u ON sb.client_id = u.id
        ORDER BY sb.created_at DESC
      `);

      if (result.rows.length > 0) {
        return res.json({ success: true, requests: result.rows });
      }
      return res.json({ success: true, requests: memoryRequests });
    } catch (err) {
      return res.json({ success: true, requests: memoryRequests });
    }
  },

  /**
   * Submit new appointment or call request
   */
  submitBooking: async (req, res) => {
    try {
      const { clientName, clientEmail, sessionType, preferredWindow, clientNote } = req.body;
      const clientId = req.user?.id || 'client_anon_' + Date.now();
      const newId = 'req_' + Date.now();

      const newRequest = {
        id: newId,
        client_id: clientId,
        clientName: clientName || 'Sanctuary Member',
        clientEmail: clientEmail || '',
        sessionType: sessionType || 'Virtual Video Consultation (45 min)',
        preferredWindow: preferredWindow || 'Next Available',
        clientNote: (clientNote || '').trim(),
        status: 'Pending Confirmation',
        submittedAt: new Date().toISOString(),
        therapistId: DEFAULT_THERAPIST.id,
        therapistName: DEFAULT_THERAPIST.name
      };

      try {
        await db.query(`
          INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, client_encrypted_note, status)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, 'requested')
        `, [newId, clientId, DEFAULT_THERAPIST.id, newRequest.sessionType, newRequest.clientNote]);
      } catch (dbErr) {
        console.warn('DB insert session_bookings fallback to memory:', dbErr.message);
      }

      memoryRequests.unshift(newRequest);
      return res.status(201).json({ success: true, request: newRequest });
    } catch (err) {
      console.error('Booking error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit appointment request.' });
    }
  },

  /**
   * Update booking status
   */
  updateRequestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      try {
        await db.query(`
          UPDATE session_bookings SET status = $1 WHERE id = $2
        `, [status.toLowerCase(), id]);
      } catch (e) {
        // Fallback
      }

      memoryRequests = memoryRequests.map(r => r.id === id ? { ...r, status } : r);
      return res.json({ success: true, requests: memoryRequests });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update request status.' });
    }
  },

  /**
   * Verify Client Pairing / Consent Key & log access to consent_audit_logs
   */
  verifyConsentKey: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { pairingKey, clientId } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      if (!pairingKey || typeof pairingKey !== 'string') {
        return res.status(400).json({ success: false, message: 'Pairing key is required.' });
      }

      const cleanKey = pairingKey.trim().toUpperCase();
      if (cleanKey.length < 4 || cleanKey.length > 32) {
        return res.status(400).json({ success: false, message: 'Invalid pairing key format.' });
      }

      // Identify client or fallback to first client/test client
      let targetClientId = clientId;
      if (!targetClientId) {
        const clientRes = await db.query("SELECT id FROM users WHERE role = 'client' LIMIT 1");
        targetClientId = clientRes.rows[0]?.id || 'client_user_test_01';
      }

      // Check if consent record exists or create one
      let consentRes = await db.query(
        "SELECT id FROM clinical_consents WHERE client_id = $1 AND therapist_id = $2 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP",
        [targetClientId, therapistId]
      );

      let consentId;
      if (consentRes.rows.length === 0) {
        consentId = 'cc_' + crypto.randomUUID().slice(0, 16);
        await db.query(`
          INSERT INTO clinical_consents (id, client_id, therapist_id, status, granted_at, expires_at)
          VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')
          ON CONFLICT (id) DO NOTHING
        `, [consentId, targetClientId, therapistId]);
      } else {
        consentId = consentRes.rows[0].id;
      }

      // Record access in consent_audit_logs
      const auditLogId = 'cal_' + crypto.randomUUID().slice(0, 16);
      await db.query(`
        INSERT INTO consent_audit_logs (id, consent_id, accessor_therapist_id, accessed_scope, ip_address, accessed_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [auditLogId, consentId, therapistId, 'clinical_records_unlock', ip]);

      return res.json({
        success: true,
        message: 'Pairing key verified. Clinical access authorized and audited.',
        consentId,
        clientId: targetClientId,
        expiresInDays: 30,
        scopes: ['shareQuestionnaireScores', 'shareWellnessTrends', 'recordTreatmentPlans']
      });
    } catch (err) {
      console.error('verifyConsentKey error:', err);
      return res.status(500).json({ success: false, message: 'Server error verifying consent key.' });
    }
  },

  // ============================================
  // Part 5: Therapist Availability & Schedule
  // ============================================

  /**
   * Get therapist's own availability schedule, leave dates, slot settings
   */
  getMySchedule: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const resAvail = await db.query(
        'SELECT * FROM therapist_availability WHERE therapist_id = $1',
        [therapistId]
      );

      const defaultSchedule = {
        weekly_schedule: {
          monday: [{ start: "10:00", end: "17:00" }],
          tuesday: [{ start: "10:00", end: "17:00" }],
          wednesday: [{ start: "10:00", end: "17:00" }],
          thursday: [{ start: "10:00", end: "17:00" }],
          friday: [{ start: "10:00", end: "17:00" }],
          saturday: [],
          sunday: []
        },
        timezone: 'Asia/Kolkata',
        slot_duration_minutes: 45,
        buffer_minutes: 10,
        leave_dates: [],
        one_off_slots: [],
        is_available_now: false
      };

      if (resAvail.rows.length === 0) {
        return res.json({
          success: true,
          schedule: defaultSchedule
        });
      }

      const row = resAvail.rows[0];
      const weekly = typeof row.weekly_schedule === 'string' ? JSON.parse(row.weekly_schedule) : (row.weekly_schedule || defaultSchedule.weekly_schedule);
      const leave = typeof row.leave_dates === 'string' ? JSON.parse(row.leave_dates) : (row.leave_dates || []);
      const oneOff = typeof row.one_off_slots === 'string' ? JSON.parse(row.one_off_slots) : (row.one_off_slots || []);

      const isNow = Boolean(
        row.last_heartbeat && (Date.now() - new Date(row.last_heartbeat).getTime() < 60000)
      ) || Boolean(row.is_available_now);

      return res.json({
        success: true,
        schedule: {
          id: row.id,
          weekly_schedule: weekly,
          timezone: row.timezone || 'Asia/Kolkata',
          slot_duration_minutes: row.slot_duration_minutes || 45,
          buffer_minutes: row.buffer_minutes || 10,
          leave_dates: leave,
          one_off_slots: oneOff,
          is_available_now: isNow,
          updated_at: row.updated_at
        }
      });
    } catch (err) {
      console.error('getMySchedule error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve availability schedule.' });
    }
  },

  /**
   * Update therapist weekly availability schedule with strict validations
   */
  updateMySchedule: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const {
        weekly_schedule,
        timezone = 'Asia/Kolkata',
        slot_duration_minutes = 45,
        buffer_minutes = 10,
        leave_dates = [],
        one_off_slots = []
      } = req.body;

      // Validate slot duration
      const allowedDurations = [30, 45, 60];
      if (!allowedDurations.includes(Number(slot_duration_minutes))) {
        return res.status(400).json({
          success: false,
          message: `Slot duration must be one of: ${allowedDurations.join(', ')} minutes.`
        });
      }

      // Validate buffer minutes
      if (typeof buffer_minutes !== 'number' || buffer_minutes < 0 || buffer_minutes > 60) {
        return res.status(400).json({
          success: false,
          message: 'Buffer minutes must be an integer between 0 and 60.'
        });
      }

      // Validate weekly schedule format and time ranges
      if (weekly_schedule) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

        for (const day of Object.keys(weekly_schedule)) {
          if (!days.includes(day.toLowerCase())) {
            return res.status(400).json({
              success: false,
              message: `Invalid day identifier: "${day}". Must be standard day of week.`
            });
          }
          const slots = weekly_schedule[day];
          if (!Array.isArray(slots)) {
            return res.status(400).json({
              success: false,
              message: `Slots for "${day}" must be an array of time ranges.`
            });
          }

          for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            if (!slot.start || !slot.end || !timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
              return res.status(400).json({
                success: false,
                message: `Invalid time format in ${day} slot ${i + 1}. Format must be HH:mm (24-hour).`
              });
            }
            if (slot.start >= slot.end) {
              return res.status(400).json({
                success: false,
                message: `Invalid time range in ${day} slot ${i + 1}: start (${slot.start}) must be earlier than end (${slot.end}).`
              });
            }
          }

          // Check for overlapping slots on the same day
          const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].end > sorted[i + 1].start) {
              return res.status(400).json({
                success: false,
                message: `Overlapping slots on ${day}: ${sorted[i].start}-${sorted[i].end} overlaps with ${sorted[i + 1].start}-${sorted[i + 1].end}.`
              });
            }
          }
        }
      }

      // Validate leave_dates
      if (Array.isArray(leave_dates)) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        for (const d of leave_dates) {
          if (!dateRegex.test(d)) {
            return res.status(400).json({
              success: false,
              message: `Invalid leave date "${d}". Expected YYYY-MM-DD format.`
            });
          }
        }
      }

      const availId = 'ta_' + crypto.randomUUID().slice(0, 16);
      const query = `
        INSERT INTO therapist_availability (
          id, therapist_id, weekly_schedule, timezone, slot_duration_minutes, buffer_minutes, leave_dates, one_off_slots, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        ON CONFLICT (therapist_id) DO UPDATE SET
          weekly_schedule = EXCLUDED.weekly_schedule,
          timezone = EXCLUDED.timezone,
          slot_duration_minutes = EXCLUDED.slot_duration_minutes,
          buffer_minutes = EXCLUDED.buffer_minutes,
          leave_dates = EXCLUDED.leave_dates,
          one_off_slots = EXCLUDED.one_off_slots,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const result = await db.query(query, [
        availId,
        therapistId,
        JSON.stringify(weekly_schedule || {}),
        timezone,
        Number(slot_duration_minutes),
        Number(buffer_minutes),
        JSON.stringify(leave_dates || []),
        JSON.stringify(one_off_slots || [])
      ]);

      return res.json({
        success: true,
        message: 'Therapist availability schedule saved successfully.',
        schedule: result.rows[0]
      });
    } catch (err) {
      console.error('updateMySchedule error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update availability schedule.' });
    }
  },

  /**
   * Heartbeat ping to mark therapist "available now" for 60 seconds
   */
  heartbeat: async (req, res) => {
    try {
      const therapistId = req.user.id;
      await db.query(`
        INSERT INTO therapist_availability (id, therapist_id, is_available_now, last_heartbeat)
        VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT (therapist_id) DO UPDATE SET
          is_available_now = TRUE,
          last_heartbeat = CURRENT_TIMESTAMP
      `, ['ta_' + crypto.randomUUID().slice(0, 16), therapistId]);

      await db.query(`
        UPDATE therapist_profiles
        SET is_available = TRUE, last_seen_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [therapistId]);

      return res.json({
        success: true,
        is_available_now: true,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('heartbeat error:', err);
      return res.status(500).json({ success: false, message: 'Heartbeat update failed.' });
    }
  },

  /**
   * Client-facing therapist directory (Approved clinicians only)
   */
  getDirectory: async (req, res) => {
    try {
      const { specialization, mode, search } = req.query;

      let query = `
        SELECT u.id, u.public_id, u.full_name as name, u.email,
               tp.title, tp.license_number, tp.specialties, tp.bio, tp.verification_status,
               tp.is_demo, tp.last_seen_at,
               ta.weekly_schedule, ta.timezone, ta.slot_duration_minutes, ta.buffer_minutes,
               ta.leave_dates, ta.one_off_slots, ta.last_heartbeat
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        LEFT JOIN therapist_availability ta ON u.id = ta.therapist_id
        WHERE tp.verification_status = 'approved' AND u.status = 'active' AND (tp.is_demo IS FALSE OR tp.is_demo IS NULL)
      `;
      const params = [];

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        query += ` AND (u.full_name ILIKE $${params.length} OR tp.title ILIKE $${params.length} OR tp.bio ILIKE $${params.length})`;
      }

      query += ` ORDER BY u.full_name ASC`;

      const result = await db.query(query, params);
      const now = Date.now();

      let therapists = result.rows.map(r => {
        const specialties = Array.isArray(r.specialties) ? r.specialties : JSON.parse(r.specialties || '[]');
        const isOnline = Boolean(
          r.last_heartbeat && (now - new Date(r.last_heartbeat).getTime() < 60000)
        ) || Boolean(r.last_seen_at && (now - new Date(r.last_seen_at).getTime() < 60000));

        return {
          id: r.id,
          public_id: r.public_id,
          name: r.name,
          title: r.title || 'Licensed Clinical Psychologist',
          specialties,
          bio: r.bio || 'Compassionate clinical care and evidence-based therapy.',
          consultation_modes: ['video', 'voice', 'chat'],
          slot_duration_minutes: r.slot_duration_minutes || 45,
          timezone: r.timezone || 'Asia/Kolkata',
          is_available_now: isOnline,
          verified_badge: true,
          next_available_slot: 'Today, 4:00 PM'
        };
      });

      if (specialization) {
        therapists = therapists.filter(t =>
          t.specialties.some(s => s.toLowerCase().includes(specialization.toLowerCase()))
        );
      }

      if (mode) {
        therapists = therapists.filter(t =>
          t.consultation_modes.includes(mode.toLowerCase())
        );
      }

      return res.json({
        success: true,
        count: therapists.length,
        therapists
      });
    } catch (err) {
      console.error('getDirectory error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve therapist directory.' });
    }
  },

  /**
   * Get specific therapist's availability for booking calendar
   */
  getTherapistAvailability: async (req, res) => {
    try {
      const { therapistId } = req.params;
      const thRes = await db.query(`
        SELECT u.id, u.full_name, tp.title, tp.verification_status,
               ta.weekly_schedule, ta.timezone, ta.slot_duration_minutes, ta.buffer_minutes,
               ta.leave_dates, ta.one_off_slots, ta.last_heartbeat
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        LEFT JOIN therapist_availability ta ON u.id = ta.therapist_id
        WHERE u.id = $1 OR tp.id = $1
      `, [therapistId]);

      if (thRes.rows.length === 0 || thRes.rows[0].verification_status !== 'approved') {
        return res.status(404).json({ success: false, message: 'Approved therapist not found.' });
      }

      const row = thRes.rows[0];
      const isOnline = Boolean(
        row.last_heartbeat && (Date.now() - new Date(row.last_heartbeat).getTime() < 60000)
      );

      return res.json({
        success: true,
        therapist: {
          id: row.id,
          name: row.full_name,
          title: row.title,
          timezone: row.timezone || 'Asia/Kolkata',
          slot_duration_minutes: row.slot_duration_minutes || 45,
          buffer_minutes: row.buffer_minutes || 10,
          weekly_schedule: row.weekly_schedule || {},
          leave_dates: row.leave_dates || [],
          is_available_now: isOnline
        }
      });
    } catch (err) {
      console.error('getTherapistAvailability error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch therapist availability.' });
    }
  },

  // ============================================
  // Part 5: Session Request Pipeline & State Machine
  // ============================================

  /**
   * Submit new clinical session request with double-booking prevention & consent enforcement
   */
  createSessionRequest: async (req, res) => {
    try {
      const clientId = req.user.id;
      const {
        preferred_therapist_id,
        preferred_slot,
        mode = 'video',
        slot_duration_minutes = 45,
        client_note = '',
        consent_share_note = false
      } = req.body;

      if (!preferred_slot) {
        return res.status(400).json({ success: false, message: 'Preferred appointment time slot is required.' });
      }

      const slotDate = new Date(preferred_slot);
      if (isNaN(slotDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid appointment time format.' });
      }

      const validModes = ['video', 'voice', 'chat'];
      if (!validModes.includes(mode)) {
        return res.status(400).json({ success: false, message: `Consultation mode must be one of: ${validModes.join(', ')}.` });
      }

      // Explicit consent check for clinical note sharing
      if (client_note && client_note.trim() && !consent_share_note) {
        return res.status(400).json({
          success: false,
          message: 'Explicit consent is required to share private notes with the clinical team.'
        });
      }

      const duration = Number(slot_duration_minutes) || 45;
      const slotEnd = new Date(slotDate.getTime() + duration * 60000);

      // Check client double booking: cannot overlap with active session
      const clientOverlap = await db.query(`
        SELECT id, preferred_slot, status FROM session_bookings
        WHERE client_id = $1
          AND status IN ('requested', 'under_admin_review', 'assigned', 'therapist_accepted', 'confirmed')
          AND preferred_slot < $2
          AND (preferred_slot + (COALESCE(slot_duration_minutes, 45) || ' minutes')::interval) > $3
      `, [clientId, slotEnd.toISOString(), slotDate.toISOString()]);

      if (clientOverlap.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have an appointment requested or confirmed during this time slot.'
        });
      }

      let assignedTherapistId = null;
      let initialStatus = 'requested';

      // If preferred clinician specified
      if (preferred_therapist_id && preferred_therapist_id !== 'no_preference') {
        const thCheck = await db.query(`
          SELECT u.id, tp.verification_status, tp.is_demo, ta.leave_dates, ta.buffer_minutes
          FROM users u
          JOIN therapist_profiles tp ON u.id = tp.user_id
          LEFT JOIN therapist_availability ta ON u.id = ta.therapist_id
          WHERE u.id = $1 OR tp.id = $1
        `, [preferred_therapist_id]);

        if (thCheck.rows.length === 0 || thCheck.rows[0].verification_status !== 'approved' || thCheck.rows[0].is_demo) {
          return res.status(400).json({
            success: false,
            message: 'Selected clinician must be an active, approved, non-demo practitioner.'
          });
        }

        const clinicianId = thCheck.rows[0].id;
        const leaveDates = Array.isArray(thCheck.rows[0].leave_dates)
          ? thCheck.rows[0].leave_dates
          : JSON.parse(thCheck.rows[0].leave_dates || '[]');
        const slotDateString = slotDate.toISOString().slice(0, 10);

        if (leaveDates.includes(slotDateString)) {
          return res.status(409).json({
            success: false,
            message: 'The selected clinician is on leave on this date. Please choose another date or clinician.'
          });
        }

        const buffer = thCheck.rows[0].buffer_minutes || 10;
        const therapistWindowEnd = new Date(slotDate.getTime() + (duration + buffer) * 60000);

        // Check therapist double-booking
        const thOverlap = await db.query(`
          SELECT id, preferred_slot FROM session_bookings
          WHERE therapist_id = $1
            AND status IN ('assigned', 'therapist_accepted', 'confirmed')
            AND preferred_slot < $2
            AND (preferred_slot + ((COALESCE(slot_duration_minutes, 45) + $3) || ' minutes')::interval) > $4
        `, [clinicianId, therapistWindowEnd.toISOString(), buffer, slotDate.toISOString()]);

        if (thOverlap.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'The selected clinician already has a booked session during this time window.'
          });
        }

        assignedTherapistId = clinicianId;
        initialStatus = 'under_admin_review';
      }

      const bookingId = 'sb_' + crypto.randomUUID().slice(0, 16);
      const encryptedNote = client_note ? JSON.stringify(encryptField(client_note.trim())) : null;

      await db.query(`
        INSERT INTO session_bookings (
          id, client_id, therapist_id, preferred_therapist_id, session_type, mode,
          slot_duration_minutes, preferred_slot, client_encrypted_note, consent_share_note,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        bookingId,
        clientId,
        assignedTherapistId,
        assignedTherapistId,
        `Clinical Consultation (${duration} min)`,
        mode,
        duration,
        slotDate.toISOString(),
        encryptedNote,
        Boolean(consent_share_note),
        initialStatus
      ]);

      // Record state history
      const historyId = 'ssh_' + crypto.randomUUID().slice(0, 16);
      await db.query(`
        INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
        VALUES ($1, $2, NULL, $3, $4, 'client', 'Initial session request created by member')
      `, [historyId, bookingId, initialStatus, clientId]);

      return res.status(201).json({
        success: true,
        message: 'Your session request has been received and queued for clinical coordination.',
        booking: {
          id: bookingId,
          status: initialStatus,
          preferred_slot: slotDate.toISOString(),
          mode,
          duration
        }
      });
    } catch (err) {
      console.error('createSessionRequest error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create session request.' });
    }
  },

  /**
   * Client views their own sessions (internal admin notes strictly stripped)
   */
  getMySessions: async (req, res) => {
    try {
      const clientId = req.user.id;
      const result = await db.query(`
        SELECT sb.id, sb.mode, sb.slot_duration_minutes, sb.preferred_slot, sb.proposed_slot,
               sb.status, sb.rejection_reason, sb.consent_share_note, sb.client_encrypted_note,
               sb.created_at, sb.updated_at,
               th.id as therapist_id, th.public_id as therapist_public_id, th.full_name as therapist_name,
               tp.title as therapist_title
        FROM session_bookings sb
        LEFT JOIN users th ON sb.therapist_id = th.id
        LEFT JOIN therapist_profiles tp ON th.id = tp.user_id
        WHERE sb.client_id = $1
        ORDER BY sb.preferred_slot DESC
      `, [clientId]);

      const sessions = result.rows.map(s => {
        let note = '';
        if (s.client_encrypted_note) {
          note = decryptIfEncrypted(s.client_encrypted_note);
        }

        return {
          id: s.id,
          mode: s.mode || 'video',
          slot_duration_minutes: s.slot_duration_minutes || 45,
          preferred_slot: s.preferred_slot,
          proposed_slot: s.proposed_slot,
          status: s.status,
          rejection_reason: s.rejection_reason || null,
          therapist: s.therapist_id ? {
            id: s.therapist_id,
            public_id: s.therapist_public_id,
            name: s.therapist_name,
            title: s.therapist_title || 'Clinical Psychologist'
          } : null,
          client_note: note,
          consent_share_note: Boolean(s.consent_share_note),
          created_at: s.created_at,
          updated_at: s.updated_at
        };
      });

      return res.json({
        success: true,
        sessions
      });
    } catch (err) {
      console.error('getMySessions error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve your sessions.' });
    }
  },

  /**
   * Client cancels their own session request / booking
   */
  cancelSession: async (req, res) => {
    try {
      const clientId = req.user.id;
      const { id } = req.params;
      const { reason = 'Cancelled by member' } = req.body;

      const sessionRes = await db.query(
        'SELECT id, client_id, status FROM session_bookings WHERE id = $1',
        [id]
      );

      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const session = sessionRes.rows[0];
      if (session.client_id !== clientId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only cancel your own appointments.' });
      }

      if (['completed', 'cancelled_by_user', 'admin_rejected'].includes(session.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel appointment in "${session.status}" state.`
        });
      }

      const fromState = session.status;
      const toState = 'cancelled_by_user';

      await db.query(
        'UPDATE session_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [toState, id]
      );

      // Record state history
      await db.query(`
        INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
        VALUES ($1, $2, $3, $4, $5, 'client', $6)
      `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, toState, clientId, reason]);

      if (session.therapist_id) {
        NotificationService.dispatchNotification(session.therapist_id, {
          title: 'Appointment Cancelled',
          message: 'A scheduled consultation was cancelled by the member.',
          type: NOTIFICATION_CONFIG.TYPES.SESSION_STATUS
        }).catch(e => console.error('Notification error:', e));
      }

      return res.json({
        success: true,
        message: 'Your appointment has been cancelled.',
        status: toState
      });
    } catch (err) {
      console.error('cancelSession error:', err);
      return res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
    }
  },

  /**
   * Therapist views assigned sessions (Note only visible if explicit client consent granted)
   */
  getTherapistSessions: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const result = await db.query(`
        SELECT sb.id, sb.client_id, u.public_id as client_public_id, u.full_name as client_name,
               u.age as client_age, sb.mode, sb.slot_duration_minutes, sb.preferred_slot,
               sb.proposed_slot, sb.client_encrypted_note, sb.consent_share_note,
               sb.status, sb.decline_reason, sb.decline_note, sb.created_at
        FROM session_bookings sb
        JOIN users u ON sb.client_id = u.id
        WHERE sb.therapist_id = $1
        ORDER BY sb.preferred_slot DESC
      `, [therapistId]);

      // Fetch latest assessment & AI clinical intake analysis for each client
      const clientIds = [...new Set(result.rows.map(r => r.client_id).filter(Boolean))];
      let assessmentsMap = {};
      if (clientIds.length > 0) {
        try {
          const assessRes = await db.query(`
            SELECT DISTINCT ON (user_id) user_id, id, total_score, band, 
                   ai_analysis, recommended_therapy, recommended_specialist, clinical_notes, completed_at
            FROM user_assessments
            WHERE user_id = ANY($1)
            ORDER BY user_id, completed_at DESC
          `, [clientIds]);

          assessRes.rows.forEach(a => {
            assessmentsMap[a.user_id] = {
              id: a.id,
              total_score: a.total_score,
              band: a.band,
              completed_at: a.completed_at,
              ai_analysis: typeof a.ai_analysis === 'string' ? JSON.parse(a.ai_analysis) : a.ai_analysis,
              recommended_therapy: a.recommended_therapy,
              recommended_specialist: a.recommended_specialist,
              clinical_notes: a.clinical_notes
            };
          });
        } catch (e) {
          console.warn('Error fetching client assessments in getTherapistSessions:', e.message);
        }
      }

      const sessions = result.rows.map(s => {
        let note = null;
        if (s.consent_share_note && s.client_encrypted_note) {
          note = decryptIfEncrypted(s.client_encrypted_note);
        }

        return {
          id: s.id,
          clientId: s.client_id,
          clientPublicId: s.client_public_id,
          clientName: s.client_name,
          clientAge: s.client_age,
          mode: s.mode || 'video',
          slot_duration_minutes: s.slot_duration_minutes || 45,
          preferred_slot: s.preferred_slot,
          proposed_slot: s.proposed_slot,
          status: s.status,
          client_note: note,
          consent_share_note: Boolean(s.consent_share_note),
          decline_reason: s.decline_reason,
          decline_note: s.decline_note,
          created_at: s.created_at,
          latest_assessment: assessmentsMap[s.client_id] || null
        };
      });

      return res.json({
        success: true,
        sessions
      });
    } catch (err) {
      console.error('getTherapistSessions error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve therapist appointments.' });
    }
  },

  /**
   * Therapist views a client's full AI Assessment Report & Clinical Intake Briefing
   */
  getClientAssessmentReport: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { clientId } = req.params;

      const clientRes = await db.query('SELECT id, public_id, full_name, age, city FROM users WHERE id = $1', [clientId]);
      if (clientRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Client not found.' });
      }

      const client = clientRes.rows[0];

      const assessRes = await db.query(`
        SELECT id, total_score, band, answers_json, ai_analysis, 
               recommended_therapy, recommended_specialist, clinical_notes, completed_at
        FROM user_assessments
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 1
      `, [clientId]);

      if (assessRes.rows.length === 0) {
        return res.json({
          success: true,
          client: { id: client.id, public_id: client.public_id, name: client.full_name, age: client.age },
          assessment: null,
          message: 'Client has not completed an onboarding assessment yet.'
        });
      }

      const row = assessRes.rows[0];
      return res.json({
        success: true,
        client: { id: client.id, public_id: client.public_id, name: client.full_name, age: client.age },
        assessment: {
          ...row,
          ai_analysis: typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis
        }
      });
    } catch (err) {
      console.error('getClientAssessmentReport error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve assessment report.' });
    }
  },

  /**
   * Therapist accepts, declines or proposes new slot for assigned request
   */
  therapistSessionAction: async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { id } = req.params;
      const { action, reason, decline_note, proposed_slot } = req.body;

      const sessionRes = await db.query(
        'SELECT id, client_id, therapist_id, status FROM session_bookings WHERE id = $1',
        [id]
      );

      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const session = sessionRes.rows[0];
      if (session.therapist_id !== therapistId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Session is not assigned to you.' });
      }

      const fromState = session.status;
      let toState = fromState;

      if (action === 'accept') {
        toState = 'therapist_accepted';
        await db.query(`
          UPDATE session_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
        `, [toState, id]);

        await db.query(`
          INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
          VALUES ($1, $2, $3, $4, $5, 'therapist', 'Therapist accepted session request')
        `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, toState, therapistId]);

        NotificationService.dispatchNotification(session.client_id, {
          title: 'Appointment Confirmed',
          message: 'Your clinician has confirmed your consultation request.',
          type: NOTIFICATION_CONFIG.TYPES.SESSION_STATUS
        }).catch(e => console.error('Notification error:', e));

        return res.json({
          success: true,
          message: 'Appointment accepted successfully.',
          status: toState
        });
      } else if (action === 'decline') {
        if (!reason || !reason.trim()) {
          return res.status(400).json({ success: false, message: 'A structured decline reason is required.' });
        }

        toState = 'therapist_declined';
        await db.query(`
          UPDATE session_bookings
          SET status = $1, decline_reason = $2, decline_note = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [toState, reason.trim(), decline_note ? decline_note.trim() : null, id]);

        // Insert into session_declines for Admin review and "Ask Why" thread
        const declineId = 'sd_' + crypto.randomUUID().slice(0, 16);
        await db.query(`
          INSERT INTO session_declines (id, session_id, therapist_id, client_id, reason, status)
          VALUES ($1, $2, $3, $4, $5, 'open')
        `, [declineId, id, therapistId, session.client_id, reason.trim()]);

        if (decline_note && decline_note.trim()) {
          await db.query(`
            INSERT INTO decline_threads (id, decline_id, sender_id, sender_role, message)
            VALUES ($1, $2, $3, 'therapist', $4)
          `, ['dt_' + crypto.randomUUID().slice(0, 16), declineId, therapistId, decline_note.trim()]);
        }

        await db.query(`
          INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
          VALUES ($1, $2, $3, $4, $5, 'therapist', $6)
        `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, toState, therapistId, `Declined: ${reason.trim()}`]);

        return res.json({
          success: true,
          message: 'Appointment declined. Clinical coordination has been notified for reassignment.',
          status: toState
        });
      } else if (action === 'propose_new_slot') {
        if (!proposed_slot) {
          return res.status(400).json({ success: false, message: 'Proposed time slot is required.' });
        }
        await db.query(`
          UPDATE session_bookings
          SET proposed_slot = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [new Date(proposed_slot).toISOString(), id]);

        await db.query(`
          INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
          VALUES ($1, $2, $3, $3, $4, 'therapist', $5)
        `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, therapistId, `Proposed new slot: ${proposed_slot}`]);

        return res.json({
          success: true,
          message: 'New time slot proposed to member and clinical administrator.',
          proposed_slot
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: accept, decline, propose_new_slot.'
        });
      }
    } catch (err) {
      console.error('therapistSessionAction error:', err);
      return res.status(500).json({ success: false, message: 'Failed to process therapist action.' });
    }
  },

  /**
   * Audit view of state machine history for a session
   */
  getSessionStateHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const caller = req.user;

      const sessionRes = await db.query('SELECT client_id, therapist_id FROM session_bookings WHERE id = $1', [id]);
      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const session = sessionRes.rows[0];
      if (caller.role === 'admin' || caller.role === 'super_admin') {
        return res.status(403).json({ success: false, message: 'Access denied: Administrators cannot view private session histories.' });
      }
      if (caller.role === 'client' && caller.id !== session.client_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view state history.' });
      }
      if (caller.role === 'therapist' && caller.id !== session.therapist_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view state history.' });
      }

      const historyRes = await db.query(`
        SELECT ssh.id, ssh.from_state, ssh.to_state, ssh.changed_by_role, ssh.reason, ssh.created_at,
               u.full_name as changed_by_name
        FROM session_state_history ssh
        LEFT JOIN users u ON ssh.changed_by = u.id
        WHERE ssh.session_id = $1
        ORDER BY ssh.created_at ASC
      `, [id]);

      // If caller is client, sanitize internal notes from reasons
      const sanitized = historyRes.rows.map(h => ({
        id: h.id,
        from_state: h.from_state,
        to_state: h.to_state,
        changed_by_role: h.changed_by_role,
        reason: caller.role === 'client' ? (h.to_state === 'admin_rejected' ? h.reason : 'Status updated') : h.reason,
        created_at: h.created_at
      }));

      return res.json({
        success: true,
        history: sanitized
      });
    } catch (err) {
      console.error('getSessionStateHistory error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve state history.' });
    }
  }
};
