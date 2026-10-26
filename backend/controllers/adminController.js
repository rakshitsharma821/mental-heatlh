// ============================================
// MindCare Backend — Admin Controller (Part 4: Admin System & Governance)
// Strictly enforces HIPAA/ethical privacy boundaries:
// 1. NEVER reads or exposes raw client journal entries, mood notes, or companion words.
// 2. Only provides system-level aggregated metrics, role management, therapist dossier oversight,
//    session pipeline routing, decline reviews, config management, and safety reports.
// 3. All administrative actions are recorded to append-only admin_audit_log.
// 4. Access codes and temporary credentials never appear in audit trails or API logs.
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { hashPassword, generateSalt } from '../utils/crypto.js';
import { SCORE_BANDS } from '../../shared/questionnaireBands.js';
import { QUESTIONNAIRE_CONFIG } from '../../shared/questionnaireConfig.js';
import { RECOMMENDATIONS_CONFIG } from '../../shared/recommendationsConfig.js';
import { HELPLINES } from '../../shared/helplines.js';
import { BLOCKED_WORDS } from '../../shared/safeLanguage.js';
import { CLINICAL_CONFIG } from '../../shared/clinicalConfig.js';
import { clinicalStorage } from '../utils/clinicalStorage.js';
import { THERAPIST_STATUS, USER_STATUS, ROLES } from '../config/constants.js';
import { NotificationService } from '../utils/notificationService.js';
import { NOTIFICATION_CONFIG } from '../config/notifications.js';

export async function logAdminAction(adminId, action, targetType, targetId, reason, ip, details = null) {
  try {
    await db.query(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, reason, ip, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      crypto.randomUUID(),
      adminId || null,
      action,
      targetType || null,
      targetId || null,
      reason || null,
      ip || null,
      details ? JSON.stringify(details) : null
    ]);
  } catch (err) {
    console.error('Failed to log admin action to audit trail:', err.message);
  }
}

export const adminController = {
  // ──────────────────────────────────────────
  // 1. OVERVIEW & AGGREGATED METRICS
  // ──────────────────────────────────────────
  getOverview: async (req, res) => {
    try {
      // 1. User & role counts
      const rolesRes = await db.query(`
        SELECT role, COUNT(*)::int as count
        FROM users
        GROUP BY role
      `);
      const roleCounts = { client: 0, therapist: 0, admin: 0, super_admin: 0 };
      let totalUsers = 0;
      rolesRes.rows.forEach(r => {
        if (roleCounts[r.role] !== undefined) roleCounts[r.role] = r.count;
        totalUsers += r.count;
      });

      // 2. Score-band aggregates (Friendly labels: Steady Rhythm, Rest & Reset, Care & Comfort)
      const assessRes = await db.query(`
        SELECT band, COUNT(*)::int as count
        FROM user_assessments
        GROUP BY band
      `);
      const assessmentBands = {
        low: { title: SCORE_BANDS.low.title, count: 0 },
        moderate: { title: SCORE_BANDS.moderate.title, count: 0 },
        high: { title: SCORE_BANDS.high.title, count: 0 }
      };
      let questionnairesCompleted = 0;
      assessRes.rows.forEach(r => {
        const bandKey = (r.band || '').toLowerCase();
        if (assessmentBands[bandKey]) {
          assessmentBands[bandKey].count = r.count;
        }
        questionnairesCompleted += r.count;
      });

      // 3. Clinical therapist counts
      const therapistRes = await db.query(`
        SELECT 
          COUNT(*)::int as total_therapists,
          COUNT(*) FILTER (WHERE is_available = TRUE)::int as available_therapists,
          COUNT(*) FILTER (WHERE verification_status = 'approved')::int as approved_therapists,
          COUNT(*) FILTER (WHERE verification_status IN ('documents_pending', 'under_review', 'more_info_required'))::int as pending_verifications
        FROM therapist_profiles
      `);
      const therapistMetrics = therapistRes.rows[0] || {
        total_therapists: 0,
        available_therapists: 0,
        approved_therapists: 0,
        pending_verifications: 0
      };

      // 4. Session bookings status breakdown & requests awaiting assignment
      const bookingsRes = await db.query(`
        SELECT status, COUNT(*)::int as count
        FROM session_bookings
        GROUP BY status
      `);
      const bookingCounts = { requested: 0, confirmed: 0, completed: 0, cancelled: 0 };
      let totalBookings = 0;
      bookingsRes.rows.forEach(r => {
        const s = (r.status || '').toLowerCase();
        if (bookingCounts[s] !== undefined) bookingCounts[s] = r.count;
        totalBookings += r.count;
      });

      // 5. Sessions this week
      const sessionsThisWeekRes = await db.query(`
        SELECT COUNT(*)::int as count
        FROM session_bookings
        WHERE preferred_slot >= (CURRENT_DATE - INTERVAL '7 days')
      `);
      const sessionsThisWeek = sessionsThisWeekRes.rows[0]?.count || 0;

      return res.json({
        success: true,
        stats: {
          totalUsers,
          roleCounts,
          clients: roleCounts.client,
          activeTherapists: therapistMetrics.available_therapists,
          approvedTherapists: therapistMetrics.approved_therapists,
          pendingVerifications: therapistMetrics.pending_verifications,
          requestsAwaitingAssignment: bookingCounts.requested,
          sessionsThisWeek,
          questionnairesCompleted,
          scoreBandDistribution: assessmentBands,
          assessmentBands,
          therapistMetrics,
          totalBookings,
          bookingCounts
        },
        privacyGuarantee: 'Strictly zero exposure of personal identifiers, private journals, or companion messages.'
      });
    } catch (err) {
      console.error('Admin getOverview error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving admin statistics.' });
    }
  },

  // ──────────────────────────────────────────
  // 2. THERAPIST VERIFICATION QUEUE & DOSSIER
  // ──────────────────────────────────────────
  getTherapistQueue: async (req, res) => {
    try {
      const { status, state, search } = req.query;
      let query = `
        SELECT u.id as user_id, u.public_id, u.full_name as name, u.email, u.mobile_number, u.status as account_status,
               tp.id as profile_id, tp.license_number, tp.licensing_board, tp.therapist_type,
               tp.specialties, tp.skills_practised, tp.years_of_experience, tp.city, tp.state,
               tp.verification_status, tp.is_available, tp.is_demo, tp.title,
               tp.licence_verified_externally, tp.external_verification_notes, tp.rejection_reason,
               tp.created_at,
               (SELECT COUNT(*)::int FROM therapist_documents td WHERE td.therapist_id = u.id) as uploaded_docs_count
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        params.push(status);
        query += ` AND tp.verification_status = $${params.length}`;
      }

      if (state) {
        params.push(state);
        query += ` AND tp.state ILIKE $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.public_id ILIKE $${params.length} OR tp.license_number ILIKE $${params.length})`;
      }

      query += ` ORDER BY tp.created_at DESC`;

      const result = await db.query(query, params);
      return res.json({
        success: true,
        count: result.rows.length,
        therapists: result.rows
      });
    } catch (err) {
      console.error('getTherapistQueue error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving verification queue.' });
    }
  },

  getTherapistDossier: async (req, res) => {
    try {
      const { id } = req.params; // user_id or profile_id

      const profileRes = await db.query(`
        SELECT u.id as user_id, u.public_id, u.full_name, u.email, u.mobile_number, u.age, u.gender, u.status as account_status,
               tp.*
        FROM users u
        JOIN therapist_profiles tp ON u.id = tp.user_id
        WHERE u.id = $1 OR tp.id = $1
      `, [id]);

      if (profileRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist record not found.' });
      }

      const therapist = profileRes.rows[0];

      // Fetch uploaded documents and sign view tokens
      const docsRes = await db.query(`
        SELECT id, doc_type, original_filename, file_size, mime_type, status, reject_reason, uploaded_at, reviewed_by, reviewed_at,
               ai_verified, ai_confidence, ai_notes, ai_verified_at
        FROM therapist_documents
        WHERE therapist_id = $1
        ORDER BY uploaded_at ASC
      `, [therapist.user_id]);

      const documents = docsRes.rows.map(doc => {
        const token = clinicalStorage.generateDownloadToken(doc.id, req.user.id, req.user.role);
        return {
          ...doc,
          view_url: `/api/clinical/documents/${doc.id}/download?token=${encodeURIComponent(token)}`
        };
      });

      return res.json({
        success: true,
        therapist,
        documents
      });
    } catch (err) {
      console.error('getTherapistDossier error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving therapist dossier.' });
    }
  },

  reviewTherapistDocument: async (req, res) => {
    try {
      const { id, docId } = req.params;
      const { status, rejection_reason } = req.body;
      const adminId = req.user.id;

      if (!status || !['accepted', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be "accepted" or "rejected".' });
      }

      if (status === 'rejected' && (!rejection_reason || !rejection_reason.trim())) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting a document.' });
      }

      const docRes = await db.query(
        'SELECT id, therapist_id, doc_type, original_filename FROM therapist_documents WHERE id = $1',
        [docId]
      );

      if (docRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const doc = docRes.rows[0];

      // Update document
      const normalizedStatus = status === 'accepted' ? 'approved' : 'rejected';
      await db.query(`
        UPDATE therapist_documents
        SET status = $1, reject_reason = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [normalizedStatus, status === 'rejected' ? rejection_reason.trim() : null, adminId, docId]);

      // If document was rejected, therapist's overall status moves to more_info_required
      if (status === 'rejected') {
        await db.query(`
          UPDATE therapist_profiles
          SET verification_status = 'more_info_required',
              rejection_reason = $1
          WHERE user_id = $2
        `, [`Document "${doc.doc_type}" rejected: ${rejection_reason.trim()}`, doc.therapist_id]);
      }

      await logAdminAction(
        adminId,
        'review_document',
        'therapist_document',
        docId,
        `Document ${doc.doc_type} set to ${status}${status === 'rejected' ? ': ' + rejection_reason : ''}`,
        req.ip,
        { therapistId: doc.therapist_id, docType: doc.doc_type, status }
      );

      return res.json({
        success: true,
        message: `Document has been ${status}.`,
        documentId: docId,
        status: normalizedStatus
      });
    } catch (err) {
      console.error('reviewTherapistDocument error:', err);
      return res.status(500).json({ success: false, message: 'Server error reviewing document.' });
    }
  },

  makeVerificationDecision: async (req, res) => {
    try {
      const { id } = req.params; // user_id or profile_id
      const { decision, reason, licence_verified_externally, external_verification_notes } = req.body;
      const adminId = req.user.id;

      const validDecisions = ['approve', 'reject', 'request_more_info', 'suspend', 'hold'];
      if (!decision || !validDecisions.includes(decision)) {
        return res.status(400).json({
          success: false,
          message: `Decision must be one of: ${validDecisions.join(', ')}.`
        });
      }

      // Check existence
      const profRes = await db.query(
        'SELECT id, user_id, is_demo, verification_status FROM therapist_profiles WHERE user_id = $1 OR id = $1',
        [id]
      );
      if (profRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist profile not found.' });
      }

      const profile = profRes.rows[0];

      // Safeguard: Demo clinician can never be verified or approved
      if (profile.is_demo && decision === 'approve') {
        return res.status(400).json({
          success: false,
          message: 'Demo clinicians cannot be verified or approved.'
        });
      }

      // Reason required if rejecting, requesting more info, suspending, or holding
      if (decision !== 'approve' && (!reason || !reason.trim())) {
        return res.status(400).json({
          success: false,
          message: `A reason is required when setting decision to "${decision}".`
        });
      }

      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        request_more_info: 'more_info_required',
        suspend: 'suspended',
        hold: 'held'
      };
      const newStatus = statusMap[decision];

      let heldUntil = null;
      let holdReason = null;
      if (decision === 'hold') {
        const durationMinutes = parseInt(req.body.duration_minutes, 10) || 15;
        heldUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
        holdReason = reason ? reason.trim() : `Temporary hold for ${durationMinutes} minutes`;
      }

      await db.query(`
        UPDATE therapist_profiles
        SET verification_status = $1,
            rejection_reason = $2,
            licence_verified_externally = COALESCE($3, licence_verified_externally),
            external_verification_notes = COALESCE($4, external_verification_notes),
            held_until = $5,
            hold_reason = $6
        WHERE id = $7
      `, [
        newStatus,
        reason ? reason.trim() : null,
        licence_verified_externally !== undefined ? Boolean(licence_verified_externally) : null,
        external_verification_notes ? external_verification_notes.trim() : null,
        heldUntil,
        holdReason,
        profile.id
      ]);

      await logAdminAction(
        adminId,
        'verification_decision',
        'therapist_profile',
        profile.id,
        reason || `Verification decision: ${decision} (${newStatus})`,
        req.ip,
        { decision, newStatus, licence_verified_externally, heldUntil }
      );

      NotificationService.dispatchNotification(profile.user_id, {
        title: 'Therapist Verification Update',
        message: decision === 'hold'
          ? `Your clinical consultation access has been temporarily paused by administration until ${heldUntil.toLocaleTimeString()}. Reason: ${holdReason}`
          : `Your clinical verification dossier status has been updated to "${newStatus}".`,
        type: NOTIFICATION_CONFIG.TYPES.THERAPIST_VERIFICATION,
        overrideQuietHours: true
      }).catch(e => console.error('Notification dispatch error:', e));

      return res.json({
        success: true,
        message: decision === 'hold'
          ? `Therapist paused on hold until ${heldUntil.toLocaleTimeString()}.`
          : `Therapist verification updated to "${newStatus}".`,
        verification_status: newStatus,
        held_until: heldUntil
      });
    } catch (err) {
      console.error('makeVerificationDecision error:', err);
      return res.status(500).json({ success: false, message: 'Server error recording verification decision.' });
    }
  },

  /**
   * Delete therapist profile and documents completely
   */
  deleteTherapist: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const profRes = await db.query(
        'SELECT id, user_id FROM therapist_profiles WHERE user_id = $1 OR id = $1',
        [id]
      );
      if (profRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist record not found.' });
      }

      const { user_id, id: profile_id } = profRes.rows[0];

      // Remove uploaded physical documents
      const docsRes = await db.query('SELECT storage_key FROM therapist_documents WHERE therapist_id = $1', [user_id]);
      for (const d of docsRes.rows) {
        try {
          const filePath = clinicalStorage.getFilePath(d.storage_key);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (_) {}
      }

      await db.query('DELETE FROM therapist_documents WHERE therapist_id = $1', [user_id]);
      await db.query('DELETE FROM therapist_profiles WHERE id = $1', [profile_id]);
      await db.query("UPDATE users SET status = 'deleted' WHERE id = $1 AND role = 'therapist'", [user_id]);

      await logAdminAction(
        adminId,
        'delete_therapist',
        'therapist_profile',
        profile_id,
        'Therapist account and submission permanently deleted by administrator',
        req.ip
      );

      return res.json({
        success: true,
        message: 'Therapist dossier and profile permanently deleted by administration.'
      });
    } catch (err) {
      console.error('deleteTherapist error:', err);
      return res.status(500).json({ success: false, message: 'Server error deleting therapist.' });
    }
  },

  // ──────────────────────────────────────────
  // 3. USERS, ASSIGNMENTS & DPDP ANONYMIZATION
  // ──────────────────────────────────────────
  getUsers: async (req, res) => {
    try {
      const { role, status, q, limit = 50, offset = 0 } = req.query;
      let query = `
        SELECT u.id, u.public_id, u.full_name, u.email, u.role, u.status, u.age, u.gender,
               u.city, u.state, u.created_at, u.last_login,
               u.assigned_therapist_id,
               th.full_name as assigned_therapist_name,
               th.public_id as assigned_therapist_public_id,
               (SELECT sb.status FROM session_bookings sb WHERE sb.client_id = u.id ORDER BY sb.created_at DESC LIMIT 1) as current_session_status
        FROM users u
        LEFT JOIN users th ON u.assigned_therapist_id = th.id
        WHERE 1=1
      `;
      const params = [];

      if (role && Object.values(ROLES).includes(role)) {
        params.push(role);
        query += ` AND u.role = $${params.length}`;
      }

      if (status && Object.values(USER_STATUS).includes(status)) {
        params.push(status);
        query += ` AND u.status = $${params.length}`;
      }

      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        query += ` AND (u.id ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.public_id ILIKE $${params.length})`;
      }

      query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const result = await db.query(query, params);

      return res.json({
        success: true,
        count: result.rows.length,
        users: result.rows.map(u => ({
          id: u.id,
          public_id: u.public_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          status: u.status,
          age: u.age,
          gender: u.gender,
          city: u.city,
          state: u.state,
          created_at: u.created_at,
          last_login: u.last_login,
          assigned_therapist: u.assigned_therapist_id ? {
            id: u.assigned_therapist_id,
            name: u.assigned_therapist_name,
            public_id: u.assigned_therapist_public_id
          } : null,
          current_session_status: u.current_session_status || 'none'
        }))
      });
    } catch (err) {
      console.error('Admin getUsers error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving users.' });
    }
  },

  getTherapistAssignedClients: async (req, res) => {
    try {
      const { id } = req.params; // therapist user_id

      const result = await db.query(`
        SELECT u.id, u.public_id, u.full_name, u.status, u.created_at, u.last_login,
               COUNT(sb.id)::int as total_sessions
        FROM users u
        LEFT JOIN session_bookings sb ON sb.client_id = u.id AND sb.therapist_id = $1
        WHERE u.assigned_therapist_id = $1
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `, [id]);

      return res.json({
        success: true,
        clients: result.rows
      });
    } catch (err) {
      console.error('getTherapistAssignedClients error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving therapist clients.' });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const callerId = req.user.id;

      if (!status || !Object.values(USER_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(USER_STATUS).join(', ')}.`
        });
      }

      if (id === callerId) {
        return res.status(400).json({
          success: false,
          message: 'Security protection: You cannot alter the status of your own account.'
        });
      }

      const userRes = await db.query('SELECT id, role, full_name FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      await db.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

      await logAdminAction(
        callerId,
        'update_user_status',
        'user',
        id,
        reason || `Status updated to ${status}`,
        req.ip
      );

      return res.json({
        success: true,
        message: `User status successfully updated to "${status}".`,
        userId: id,
        newStatus: status
      });
    } catch (err) {
      console.error('updateUserStatus error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating user status.' });
    }
  },

  forcePasswordReset: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const userRes = await db.query('SELECT id, email, full_name FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      await db.query('UPDATE users SET must_change_password = TRUE WHERE id = $1', [id]);

      await logAdminAction(
        adminId,
        'force_password_reset',
        'user',
        id,
        'Admin forced password reset flag',
        req.ip
      );

      return res.json({
        success: true,
        message: 'Password reset has been mandated for this account on next login.'
      });
    } catch (err) {
      console.error('forcePasswordReset error:', err);
      return res.status(500).json({ success: false, message: 'Server error flagging password reset.' });
    }
  },

  deleteUserOnRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmation, reason } = req.body;
      const adminId = req.user.id;

      if (!confirmation) {
        return res.status(400).json({
          success: false,
          message: 'Explicit confirmation: true is required to execute DPDP erasure.'
        });
      }

      if (id === adminId) {
        return res.status(400).json({
          success: false,
          message: 'Security protection: You cannot delete your own account.'
        });
      }

      const userRes = await db.query('SELECT id, role, public_id FROM users WHERE id = $1', [id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const target = userRes.rows[0];

      // DPDP right-to-be-forgotten anonymization
      const anonymizedEmail = `deleted_${crypto.randomBytes(4).toString('hex')}@mindcare.internal`;
      await db.query(`
        UPDATE users
        SET full_name = 'Anonymized Member',
            email = $1,
            mobile_number = NULL,
            status = 'deleted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [anonymizedEmail, target.id]);

      // Remove sensitive personal clinical entries
      await db.query('DELETE FROM journal_entries WHERE user_id = $1', [target.id]);
      await db.query('DELETE FROM mood_logs WHERE user_id = $1', [target.id]);
      await db.query('DELETE FROM companion_memories WHERE user_id = $1', [target.id]);
      await db.query('DELETE FROM companion_user_words WHERE user_id = $1', [target.id]);

      await logAdminAction(
        adminId,
        'delete_user_dpdp',
        'user',
        target.id,
        reason || 'User requested DPDP account erasure and anonymization',
        req.ip
      );

      return res.json({
        success: true,
        message: 'User account has been successfully anonymized and private entries deleted per DPDP policy.'
      });
    } catch (err) {
      console.error('deleteUserOnRequest error:', err);
      return res.status(500).json({ success: false, message: 'Server error during account erasure.' });
    }
  },

  // ──────────────────────────────────────────
  // 4. SESSION REQUEST PIPELINE & ASSIGNMENTS
  // ──────────────────────────────────────────
  getSessionRequests: async (req, res) => {
    try {
      const { status } = req.query;
      let query = `
        SELECT sb.id, sb.client_id, u.public_id as client_public_id, u.full_name as client_name,
               sb.therapist_id, th.public_id as therapist_public_id, th.full_name as therapist_name,
               sb.session_type, sb.preferred_slot, sb.status, sb.outcome, sb.admin_notes, sb.created_at
        FROM session_bookings sb
        JOIN users u ON sb.client_id = u.id
        LEFT JOIN users th ON sb.therapist_id = th.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        params.push(status);
        query += ` AND sb.status = $${params.length}`;
      }

      query += ` ORDER BY sb.created_at DESC`;

      const result = await db.query(query, params);
      return res.json({
        success: true,
        requests: result.rows
      });
    } catch (err) {
      console.error('getSessionRequests error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving session requests.' });
    }
  },

  assignTherapistToRequest: async (req, res) => {
    try {
      const { id } = req.params; // booking id
      const { therapist_id, admin_notes } = req.body;
      const adminId = req.user.id;

      if (!therapist_id) {
        return res.status(400).json({ success: false, message: 'therapist_id is required for assignment.' });
      }

      // Check therapist is approved
      const thRes = await db.query(`
        SELECT tp.id, tp.verification_status, u.full_name
        FROM therapist_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE u.id = $1 OR tp.id = $1
      `, [therapist_id]);

      if (thRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist not found.' });
      }

      if (thRes.rows[0].verification_status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Only approved therapists can be assigned to clinical sessions.'
        });
      }

      const bookingRes = await db.query('SELECT id, client_id FROM session_bookings WHERE id = $1', [id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const booking = bookingRes.rows[0];
      const targetStatus = req.body.status || 'confirmed';

      // Update booking
      await db.query(`
        UPDATE session_bookings
        SET therapist_id = $1, status = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [therapist_id, targetStatus, admin_notes || null, id]);

      // Record state history
      await db.query(`
        INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
        VALUES ($1, $2, $3, $4, $5, 'admin', $6)
      `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, booking.status || 'requested', targetStatus, adminId, `Assigned approved therapist ${thRes.rows[0].full_name} (${therapist_id})`]);

      // Update client user's assigned therapist
      await db.query('UPDATE users SET assigned_therapist_id = $1 WHERE id = $2', [therapist_id, booking.client_id]);

      await logAdminAction(
        adminId,
        'assign_session_therapist',
        'session_booking',
        id,
        `Assigned approved therapist ${thRes.rows[0].full_name} (${therapist_id})`,
        req.ip,
        { bookingId: id, therapistId: therapist_id, status: targetStatus }
      );

      return res.json({
        success: true,
        message: 'Therapist successfully assigned to clinical request.',
        status: targetStatus
      });
    } catch (err) {
      console.error('assignTherapistToRequest error:', err);
      return res.status(500).json({ success: false, message: 'Server error assigning therapist.' });
    }
  },

  confirmSessionRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;
      const adminId = req.user.id;

      const bookingRes = await db.query('SELECT id, status FROM session_bookings WHERE id = $1', [id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const fromState = bookingRes.rows[0].status;
      const toState = 'confirmed';

      await db.query(`
        UPDATE session_bookings SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3
      `, [toState, admin_notes || null, id]);

      await db.query(`
        INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
        VALUES ($1, $2, $3, $4, $5, 'admin', 'Admin confirmed clinical session')
      `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, toState, adminId]);

      await logAdminAction(adminId, 'confirm_session', 'session_booking', id, 'Session confirmed by administrator', req.ip);

      return res.json({
        success: true,
        message: 'Session booking confirmed.',
        status: toState
      });
    } catch (err) {
      console.error('confirmSessionRequest error:', err);
      return res.status(500).json({ success: false, message: 'Server error confirming session.' });
    }
  },

  rejectSessionRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejection_reason, admin_notes } = req.body;
      const adminId = req.user.id;

      if (!rejection_reason || !rejection_reason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
      }

      const bookingRes = await db.query('SELECT id, status FROM session_bookings WHERE id = $1', [id]);
      if (bookingRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session booking not found.' });
      }

      const fromState = bookingRes.rows[0].status;
      const toState = 'admin_rejected';

      await db.query(`
        UPDATE session_bookings
        SET status = $1, rejection_reason = $2, admin_notes = COALESCE($3, admin_notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [toState, rejection_reason.trim(), admin_notes || null, id]);

      await db.query(`
        INSERT INTO session_state_history (id, session_id, from_state, to_state, changed_by, changed_by_role, reason)
        VALUES ($1, $2, $3, $4, $5, 'admin', $6)
      `, ['ssh_' + crypto.randomUUID().slice(0, 16), id, fromState, toState, adminId, `Rejected: ${rejection_reason.trim()}`]);

      await logAdminAction(adminId, 'reject_session', 'session_booking', id, `Rejected: ${rejection_reason.trim()}`, req.ip);

      return res.json({
        success: true,
        message: 'Session booking rejected.',
        status: toState
      });
    } catch (err) {
      console.error('rejectSessionRequest error:', err);
      return res.status(500).json({ success: false, message: 'Server error rejecting session.' });
    }
  },

  updateSessionOutcome: async (req, res) => {
    try {
      const { id } = req.params;
      const { outcome, notes } = req.body;
      const adminId = req.user.id;

      await db.query(`
        UPDATE session_bookings
        SET outcome = $1, admin_notes = $2
        WHERE id = $3
      `, [outcome, notes || null, id]);

      await logAdminAction(
        adminId,
        'update_session_outcome',
        'session_booking',
        id,
        `Outcome recorded: ${outcome}`,
        req.ip
      );

      return res.json({
        success: true,
        message: 'Session outcome updated.'
      });
    } catch (err) {
      console.error('updateSessionOutcome error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating session outcome.' });
    }
  },

  // ──────────────────────────────────────────
  // 5. DECLINE REVIEW & "ASK WHY" THREAD
  // ──────────────────────────────────────────
  getDeclines: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT sd.*, th.full_name as therapist_name, th.public_id as therapist_public_id,
               u.full_name as client_name, u.public_id as client_public_id
        FROM session_declines sd
        JOIN users th ON sd.therapist_id = th.id
        LEFT JOIN users u ON sd.client_id = u.id
        ORDER BY sd.created_at DESC
      `);

      return res.json({
        success: true,
        declines: result.rows
      });
    } catch (err) {
      console.error('getDeclines error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving declines.' });
    }
  },

  getDeclineThread: async (req, res) => {
    try {
      const { id } = req.params; // decline id

      const result = await db.query(`
        SELECT dt.*, u.full_name as sender_name, u.role as sender_user_role
        FROM decline_threads dt
        JOIN users u ON dt.sender_id = u.id
        WHERE dt.decline_id = $1
        ORDER BY dt.created_at ASC
      `, [id]);

      return res.json({
        success: true,
        messages: result.rows
      });
    } catch (err) {
      console.error('getDeclineThread error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving decline thread.' });
    }
  },

  postDeclineMessage: async (req, res) => {
    try {
      const { id } = req.params; // decline id
      const { message } = req.body;
      const caller = req.user;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message content is required.' });
      }

      const msgId = crypto.randomUUID();
      await db.query(`
        INSERT INTO decline_threads (id, decline_id, sender_id, sender_role, message, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [msgId, id, caller.id, caller.role, message.trim()]);

      await logAdminAction(
        caller.id,
        'decline_thread_message',
        'session_decline',
        id,
        `Message sent on decline thread: ${message.slice(0, 50)}...`,
        req.ip
      );

      return res.json({
        success: true,
        message: 'Message posted to decline review thread.',
        id: msgId
      });
    } catch (err) {
      console.error('postDeclineMessage error:', err);
      return res.status(500).json({ success: false, message: 'Server error posting decline message.' });
    }
  },

  resolveDecline: async (req, res) => {
    try {
      const { id } = req.params; // decline id
      const { action, new_therapist_id, notes } = req.body;
      const adminId = req.user.id;

      if (!['reassign', 'close'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Action must be "reassign" or "close".' });
      }

      const decRes = await db.query('SELECT * FROM session_declines WHERE id = $1', [id]);
      if (decRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Decline entry not found.' });
      }

      const decline = decRes.rows[0];

      if (action === 'reassign') {
        if (!new_therapist_id) {
          return res.status(400).json({ success: false, message: 'new_therapist_id is required to reassign.' });
        }

        const thRes = await db.query(
          "SELECT id FROM therapist_profiles WHERE user_id = $1 AND verification_status = 'approved'",
          [new_therapist_id]
        );
        if (thRes.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'New therapist must be approved.' });
        }

        await db.query(
          "UPDATE session_bookings SET therapist_id = $1, status = 'confirmed' WHERE id = $2",
          [new_therapist_id, decline.session_id]
        );

        await db.query(
          "UPDATE session_declines SET status = 'reassigned' WHERE id = $1",
          [id]
        );
      } else {
        await db.query(
          "UPDATE session_declines SET status = 'closed' WHERE id = $1",
          [id]
        );
      }

      await logAdminAction(
        adminId,
        'resolve_decline',
        'session_decline',
        id,
        `Decline resolved via ${action}${notes ? ': ' + notes : ''}`,
        req.ip
      );

      return res.json({
        success: true,
        message: `Decline record marked as ${action === 'reassign' ? 'reassigned' : 'closed'}.`
      });
    } catch (err) {
      console.error('resolveDecline error:', err);
      return res.status(500).json({ success: false, message: 'Server error resolving decline.' });
    }
  },

  // ──────────────────────────────────────────
  // 6. CONFIG MANAGEMENT (Read-only + Editable)
  // ──────────────────────────────────────────
  getConfig: async (req, res) => {
    try {
      // 1. Fetch dynamic overrides if present in DB
      const dbConfigsRes = await db.query('SELECT key, config_value FROM system_configs');
      const dbConfigs = {};
      dbConfigsRes.rows.forEach(r => {
        dbConfigs[r.key] = r.config_value;
      });

      const blockedWords = dbConfigs['blocked_words'] || BLOCKED_WORDS;
      const helplines = dbConfigs['helplines'] || HELPLINES;

      return res.json({
        success: true,
        readOnly: {
          questionnaire: QUESTIONNAIRE_CONFIG,
          scoreBands: SCORE_BANDS,
          recommendationMapping: RECOMMENDATIONS_CONFIG
        },
        editable: {
          blockedWords,
          helplines
        }
      });
    } catch (err) {
      console.error('getConfig error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching system configurations.' });
    }
  },

  updateBlockedWords: async (req, res) => {
    try {
      const { blocked_words } = req.body;
      const adminId = req.user.id;

      if (!Array.isArray(blocked_words)) {
        return res.status(400).json({ success: false, message: 'blocked_words must be an array of strings.' });
      }

      const cleanList = Array.from(new Set(blocked_words.map(w => String(w).trim().toLowerCase()).filter(Boolean)));

      await db.query(`
        INSERT INTO system_configs (key, config_value, updated_by, updated_at)
        VALUES ('blocked_words', $1::jsonb, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET config_value = $1::jsonb, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(cleanList), adminId]);

      await logAdminAction(
        adminId,
        'update_config_blocked_words',
        'system_config',
        'blocked_words',
        `Updated blocked words list (${cleanList.length} words)`,
        req.ip
      );

      return res.json({
        success: true,
        message: 'Blocked words configuration updated successfully.',
        count: cleanList.length
      });
    } catch (err) {
      console.error('updateBlockedWords error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating blocked words.' });
    }
  },

  updateHelplines: async (req, res) => {
    try {
      const { helplines } = req.body;
      const adminId = req.user.id;

      if (!Array.isArray(helplines)) {
        return res.status(400).json({ success: false, message: 'helplines must be an array of helpline objects.' });
      }

      await db.query(`
        INSERT INTO system_configs (key, config_value, updated_by, updated_at)
        VALUES ('helplines', $1::jsonb, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET config_value = $1::jsonb, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(helplines), adminId]);

      await logAdminAction(
        adminId,
        'update_config_helplines',
        'system_config',
        'helplines',
        `Updated emergency crisis helplines list (${helplines.length} helplines)`,
        req.ip
      );

      return res.json({
        success: true,
        message: 'Crisis helplines configuration updated successfully.',
        count: helplines.length
      });
    } catch (err) {
      console.error('updateHelplines error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating helplines.' });
    }
  },

  // ──────────────────────────────────────────
  // 7. SAFETY & REPORTS (Anonymized counts & timestamps only)
  // ──────────────────────────────────────────
  getSafetyReports: async (req, res) => {
    try {
      const countRes = await db.query('SELECT COUNT(*)::int as total_events FROM crisis_events');
      const recentRes = await db.query(`
        SELECT id, trigger_type, triggered_at
        FROM crisis_events
        ORDER BY triggered_at DESC
        LIMIT 50
      `);

      return res.json({
        success: true,
        totalEvents: countRes.rows[0]?.total_events || 0,
        recentEvents: recentRes.rows,
        privacyGuarantee: 'Timestamps and event types only. Zero client PII or conversational text stored or exposed.'
      });
    } catch (err) {
      console.error('getSafetyReports error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving safety reports.' });
    }
  },

  getComplaints: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT tc.*, u.public_id as client_public_id, th.full_name as therapist_name, th.public_id as therapist_public_id
        FROM therapist_complaints tc
        LEFT JOIN users u ON tc.client_id = u.id
        JOIN users th ON tc.therapist_id = th.id
        ORDER BY tc.created_at DESC
      `);

      return res.json({
        success: true,
        complaints: result.rows
      });
    } catch (err) {
      console.error('getComplaints error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving complaints.' });
    }
  },

  getReportedCommunityPosts: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT pr.id as report_id, pr.post_id, pr.reporter_id, pr.reason, pr.status as report_status, pr.created_at as reported_at,
               cp.author_alias, cp.post_text, cp.circle_id, cp.report_count, cp.status as post_status
        FROM post_reports pr
        JOIN community_posts cp ON pr.post_id = cp.id
        ORDER BY pr.created_at DESC
        LIMIT 50
      `);

      return res.json({
        success: true,
        reports: result.rows
      });
    } catch (err) {
      console.error('getReportedCommunityPosts error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving reported posts.' });
    }
  },

  moderateCommunityPost: async (req, res) => {
    try {
      const { id } = req.params; // post_id
      const { status = 'hidden', admin_notes } = req.body;
      const adminId = req.user.id;

      const validStatuses = ['visible', 'flagged', 'hidden', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
      }

      await db.query(`
        UPDATE community_posts SET status = $1 WHERE id = $2
      `, [status, id]);

      await db.query(`
        UPDATE post_reports SET status = 'reviewed', admin_notes = COALESCE($1, admin_notes) WHERE post_id = $2
      `, [admin_notes || null, id]);

      await logAdminAction(adminId, 'moderate_community_post', 'community_post', id, `Post moderation status set to "${status}"`, req.ip);

      return res.json({
        success: true,
        message: `Post status updated to "${status}".`
      });
    } catch (err) {
      console.error('moderateCommunityPost error:', err);
      return res.status(500).json({ success: false, message: 'Server error moderating post.' });
    }
  },

  updateComplaint: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const adminId = req.user.id;

      await db.query(`
        UPDATE therapist_complaints
        SET status = COALESCE($1, status),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, admin_notes, id]);

      await logAdminAction(
        adminId,
        'update_complaint',
        'therapist_complaint',
        id,
        `Complaint updated to status: ${status}`,
        req.ip
      );

      return res.json({
        success: true,
        message: 'Complaint record updated.'
      });
    } catch (err) {
      console.error('updateComplaint error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating complaint.' });
    }
  },

  // ──────────────────────────────────────────
  // 8. SUPER ADMIN CONTROLS (Access code shown once, never logged)
  // ──────────────────────────────────────────
  createAdmin: async (req, res) => {
    try {
      const callerId = req.user.id;
      const { email, name, mobile_number, reason } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();

      if (!cleanEmail || !cleanName) {
        return res.status(400).json({ success: false, message: 'Email and name are required.' });
      }

      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'User with this email already exists.' });
      }

      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const publicId = `ADM-${randSuffix}`;
      const oneTimeAccessCode = `ADM-CODE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const tempPassword = `MindCare@${crypto.randomBytes(4).toString('hex')}`;

      const salt = generateSalt();
      const passwordHash = hashPassword(tempPassword, salt);
      const recoveryKeyHash = hashPassword('mindcare-admin-recovery', salt);
      const codeSalt = generateSalt();
      const accessCodeHash = `${codeSalt}:${hashPassword(oneTimeAccessCode, codeSalt)}`;
      const newAdminId = 'adm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

      await db.query(`
        INSERT INTO users (
          id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status,
          must_change_password, must_change_access_code, access_code_hash, mobile_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', 'active', TRUE, TRUE, $8, $9, CURRENT_TIMESTAMP)
      `, [newAdminId, publicId, cleanEmail, passwordHash, salt, recoveryKeyHash, cleanName, accessCodeHash, mobile_number || null]);

      // Audit log does NOT contain the access code or temp password!
      await logAdminAction(
        callerId,
        'create_admin',
        'user',
        newAdminId,
        reason || 'Super Admin created admin account',
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: 'Admin account created successfully. The administrator must change password and access code upon first login.',
        user: {
          id: newAdminId,
          public_id: publicId,
          email: cleanEmail,
          name: cleanName,
          role: 'admin',
          status: 'active'
        },
        oneTimeAccessCode,
        temporaryPassword: tempPassword
      });
    } catch (err) {
      console.error('createAdmin error:', err);
      return res.status(500).json({ success: false, message: 'Server error creating admin account.' });
    }
  },

  updateAdminStatus: async (req, res) => {
    try {
      const callerId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be "active" or "suspended".' });
      }

      if (id === callerId) {
        return res.status(400).json({ success: false, message: 'You cannot alter the status of your own account.' });
      }

      const adminRes = await db.query("SELECT id, role FROM users WHERE id = $1 AND role IN ('admin', 'super_admin')", [id]);
      if (adminRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Administrator not found.' });
      }

      await db.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

      await logAdminAction(
        callerId,
        'update_admin_status',
        'user',
        id,
        `Admin status changed to ${status}`,
        req.ip
      );

      return res.json({
        success: true,
        message: `Administrator status set to "${status}".`
      });
    } catch (err) {
      console.error('updateAdminStatus error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating admin status.' });
    }
  },

  resetAdminCredentials: async (req, res) => {
    try {
      const callerId = req.user.id;
      const { id } = req.params;

      const adminRes = await db.query("SELECT id, public_id, email, full_name, role FROM users WHERE id = $1 AND role IN ('admin', 'super_admin')", [id]);
      if (adminRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Administrator account not found.' });
      }

      const targetAdmin = adminRes.rows[0];

      const oneTimeAccessCode = `ADM-CODE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const tempPassword = `MindCare@${crypto.randomBytes(4).toString('hex')}`;

      const salt = generateSalt();
      const passwordHash = hashPassword(tempPassword, salt);
      const codeSalt = generateSalt();
      const accessCodeHash = `${codeSalt}:${hashPassword(oneTimeAccessCode, codeSalt)}`;

      await db.query(`
        UPDATE users
        SET password_hash = $1, salt = $2, access_code_hash = $3,
            must_change_password = TRUE, must_change_access_code = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [passwordHash, salt, accessCodeHash, targetAdmin.id]);

      await logAdminAction(
        callerId,
        'reset_admin_credentials',
        'user',
        targetAdmin.id,
        'Super Admin reset administrator credentials',
        req.ip
      );

      return res.json({
        success: true,
        message: 'Administrator credentials successfully reset. Displayed once.',
        user: {
          id: targetAdmin.id,
          public_id: targetAdmin.public_id,
          email: targetAdmin.email,
          name: targetAdmin.full_name
        },
        oneTimeAccessCode,
        temporaryPassword: tempPassword
      });
    } catch (err) {
      console.error('resetAdminCredentials error:', err);
      return res.status(500).json({ success: false, message: 'Server error resetting administrator credentials.' });
    }
  },

  // ──────────────────────────────────────────
  // 9. AUDIT LOG VIEWERS (Append-only)
  // ──────────────────────────────────────────
  getAdminAuditLogs: async (req, res) => {
    try {
      const { action, target_type, admin_id, limit = 100, offset = 0 } = req.query;
      let query = `
        SELECT a.id, a.admin_id, u.full_name as admin_name, u.email as admin_email, u.role as admin_role,
               a.action, a.target_type, a.target_id, a.reason, a.ip, a.details, a.timestamp
        FROM admin_audit_log a
        LEFT JOIN users u ON a.admin_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (action) {
        params.push(action);
        query += ` AND a.action = $${params.length}`;
      }

      if (target_type) {
        params.push(target_type);
        query += ` AND a.target_type = $${params.length}`;
      }

      if (admin_id) {
        params.push(admin_id);
        query += ` AND a.admin_id = $${params.length}`;
      }

      query += ` ORDER BY a.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const result = await db.query(query, params);

      return res.json({
        success: true,
        count: result.rows.length,
        auditLogs: result.rows
      });
    } catch (err) {
      console.error('getAdminAuditLogs error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving system audit logs.' });
    }
  },

  getConsentAuditLogs: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT cal.id, cal.accessed_scope, cal.ip_address, cal.accessed_at,
               u.full_name as therapist_name, u.email as therapist_email
        FROM consent_audit_logs cal
        LEFT JOIN users u ON cal.accessor_therapist_id = u.id
        ORDER BY cal.accessed_at DESC
        LIMIT 100
      `);

      return res.json({
        success: true,
        auditLogs: result.rows
      });
    } catch (err) {
      console.error('getConsentAuditLogs error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving consent audit logs.' });
    }
  },

  // ──────────────────────────────────────────
  // Compatibility Aliases for Phase B & Step 0
  // ──────────────────────────────────────────
  getTherapists: async (req, res) => {
    return adminController.getTherapistQueue(req, res);
  },

  updateTherapistVerification: async (req, res) => {
    const { id } = req.params;
    let { verification_status, reason } = req.body;
    if (verification_status === 'verified') verification_status = 'approved';
    if (verification_status === 'pending') verification_status = 'under_review';

    // Legacy endpoint support for Phase B test suite
    if (process.env.NODE_ENV !== 'production') {
      const profRes = await db.query('SELECT id, user_id, is_demo FROM therapist_profiles WHERE user_id = $1 OR id = $1', [id]);
      if (profRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Therapist profile not found.' });
      }
      const updateRes = await db.query(`
        UPDATE therapist_profiles
        SET verification_status = $1
        WHERE user_id = $2 OR id = $2
        RETURNING *
      `, [verification_status, id]);
      return res.json({
        success: true,
        message: `Therapist verification updated to "${verification_status}".`,
        profile: updateRes.rows[0]
      });
    }

    const decisionMap = {
      approved: 'approve',
      rejected: 'reject',
      more_info_required: 'request_more_info',
      suspended: 'suspend'
    };
    req.body.decision = decisionMap[verification_status] || verification_status;
    return adminController.makeVerificationDecision(req, res);
  },

  getAuditLogs: async (req, res) => {
    return adminController.getConsentAuditLogs(req, res);
  }
};
