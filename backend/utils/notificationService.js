// ============================================
// MindCare Sanctuary — Notification Service (Part 7 & Part 8 Audited)
// Enforces:
// 1. Off by default (Strict Opt-in)
// 2. Consent recorded with timestamp & immutable audit trail (minimized IP/UA + retention limit)
// 3. Nothing sent without explicit consent
// 4. Quiet hours suppression with exemptions for session reminders & verification decisions
// 5. Silenced during Questionnaire Focus Mode (Server-enforced + Client-flagged)
// ============================================

import crypto from 'crypto';
import { db } from '../models/db.js';
import { NOTIFICATION_CONFIG, isTimeInQuietHours } from '../config/notifications.js';

// Server-side active focus mode registry for ongoing questionnaire sessions
const activeServerFocusUsers = new Set();

export const NotificationService = {
  /**
   * Set or clear active questionnaire focus mode on the server for a user
   */
  setServerFocusMode(userId, active) {
    if (!userId) return;
    if (active) {
      activeServerFocusUsers.add(userId);
    } else {
      activeServerFocusUsers.delete(userId);
    }
  },

  /**
   * Check if a user is currently in server-side focus mode
   */
  isUserInServerFocus(userId) {
    return activeServerFocusUsers.has(userId);
  },

  /**
   * Retrieve notification preferences for a user (or safe default: opt_in=false)
   */
  async getPreferences(userId) {
    const res = await db.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (res.rows.length === 0) {
      return {
        userId,
        optIn: false,
        consentTimestamp: null,
        quietHoursEnabled: NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_ENABLED,
        quietHoursStart: NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_START,
        quietHoursEnd: NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_END,
        sessionUpdates: true,
        reminders: true,
        therapistVerificationUpdates: true
      };
    }

    const row = res.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      optIn: Boolean(row.opt_in),
      consentTimestamp: row.consent_timestamp,
      quietHoursEnabled: Boolean(row.quiet_hours_enabled),
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      sessionUpdates: Boolean(row.session_updates),
      reminders: Boolean(row.reminders),
      therapistVerificationUpdates: Boolean(row.therapist_verification_updates),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  /**
   * Update notification preferences with consent timestamp & minimized audit entry
   */
  async updatePreferences(userId, updateData, clientMeta = {}) {
    const current = await this.getPreferences(userId);
    const newOptIn = typeof updateData.optIn === 'boolean' ? updateData.optIn : current.optIn;
    const quietHoursEnabled = typeof updateData.quietHoursEnabled === 'boolean' ? updateData.quietHoursEnabled : current.quietHoursEnabled;
    const quietHoursStart = updateData.quietHoursStart || current.quietHoursStart || NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_START;
    const quietHoursEnd = updateData.quietHoursEnd || current.quietHoursEnd || NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_END;
    const sessionUpdates = typeof updateData.sessionUpdates === 'boolean' ? updateData.sessionUpdates : current.sessionUpdates;
    const reminders = typeof updateData.reminders === 'boolean' ? updateData.reminders : current.reminders;
    const therapistVerificationUpdates = typeof updateData.therapistVerificationUpdates === 'boolean' ? updateData.therapistVerificationUpdates : current.therapistVerificationUpdates;

    const now = new Date();
    const prefId = current.id || ('np_' + crypto.randomUUID().slice(0, 16));

    await db.query(`
      INSERT INTO notification_preferences (
        id, user_id, opt_in, consent_timestamp, quiet_hours_enabled, 
        quiet_hours_start, quiet_hours_end, session_updates, reminders, 
        therapist_verification_updates, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        opt_in = EXCLUDED.opt_in,
        consent_timestamp = EXCLUDED.consent_timestamp,
        quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        session_updates = EXCLUDED.session_updates,
        reminders = EXCLUDED.reminders,
        therapist_verification_updates = EXCLUDED.therapist_verification_updates,
        updated_at = EXCLUDED.updated_at
    `, [
      prefId, userId, newOptIn, now, quietHoursEnabled,
      quietHoursStart, quietHoursEnd, sessionUpdates, reminders,
      therapistVerificationUpdates, now
    ]);

    // Record audit action
    const auditAction = current.optIn !== newOptIn
      ? (newOptIn ? 'opt_in' : 'opt_out')
      : 'update_preferences';

    // DPDP Data Minimization: Truncate IP to subnet /24 and sanitize user-agent to 40 chars max
    let anonymizedIp = null;
    if (clientMeta.ip) {
      const parts = String(clientMeta.ip).replace(/^.*:/, '').split('.');
      if (parts.length === 4) {
        anonymizedIp = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      } else {
        anonymizedIp = 'subnet-masked';
      }
    }
    const sanitizedUa = clientMeta.userAgent ? String(clientMeta.userAgent).slice(0, 40) : null;

    await db.query(`
      INSERT INTO notification_consent_audit (
        id, user_id, action, previous_opt_in, new_opt_in, 
        consent_timestamp, client_ip, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'nca_' + crypto.randomUUID().slice(0, 16),
      userId,
      auditAction,
      current.optIn,
      newOptIn,
      now,
      anonymizedIp,
      sanitizedUa
    ]);

    // Enforce DPDP retention limit: keep only the latest 20 entries per user
    await db.query(`
      DELETE FROM notification_consent_audit
      WHERE user_id = $1 AND id NOT IN (
        SELECT id FROM notification_consent_audit
        WHERE user_id = $1
        ORDER BY consent_timestamp DESC
        LIMIT $2
      )
    `, [userId, NOTIFICATION_CONFIG.CONSENT_AUDIT_RETENTION_LIMIT || 20]);

    return this.getPreferences(userId);
  },

  /**
   * Dispatch a notification to a user with strict consent & quiet-hour gating
   */
  async dispatchNotification(userId, {
    title,
    message,
    type = NOTIFICATION_CONFIG.TYPES.SYSTEM,
    isFocusMode = false,
    overrideQuietHours = false,
    referenceDate = new Date()
  }) {
    // 1. Fetch user preferences
    const pref = await this.getPreferences(userId);

    // GATE 1: Strictly OFF by default. Nothing sent without consent.
    if (!pref.optIn) {
      return {
        delivered: false,
        reason: 'no_consent',
        message: 'Notification dropped: user has not opted into notifications.'
      };
    }

    // GATE 2: Never during Questionnaire Focus Mode (Client flag OR Server-side active focus mode)
    if (isFocusMode || activeServerFocusUsers.has(userId)) {
      return {
        delivered: false,
        reason: 'silenced_focus_mode',
        message: 'Notification silenced: member is in questionnaire focus mode.'
      };
    }

    // GATE 3: Category Preferences Check
    if (type === NOTIFICATION_CONFIG.TYPES.SESSION_STATUS && !pref.sessionUpdates) {
      return {
        delivered: false,
        reason: 'category_disabled',
        message: 'Notification dropped: session updates category disabled.'
      };
    }
    if (type === NOTIFICATION_CONFIG.TYPES.SESSION_REMINDER && !pref.reminders) {
      return {
        delivered: false,
        reason: 'category_disabled',
        message: 'Notification dropped: reminders category disabled.'
      };
    }
    if (type === NOTIFICATION_CONFIG.TYPES.THERAPIST_VERIFICATION && !pref.therapistVerificationUpdates) {
      return {
        delivered: false,
        reason: 'category_disabled',
        message: 'Notification dropped: therapist verification updates category disabled.'
      };
    }

    // GATE 4: Quiet Hours (Restorative Sleep)
    // EXEMPTION: Session reminders & Therapist verification decisions are strictly EXEMPT from quiet hours
    const isExempt = NOTIFICATION_CONFIG.EXEMPT_FROM_QUIET_HOURS.includes(type);

    if (pref.quietHoursEnabled && !overrideQuietHours && !isExempt) {
      const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
      const hours = String(ref.getHours()).padStart(2, '0');
      const minutes = String(ref.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (isTimeInQuietHours(timeStr, pref.quietHoursStart, pref.quietHoursEnd)) {
        return {
          delivered: false,
          reason: 'suppressed_quiet_hours',
          message: `Notification withheld: quiet hours active (${pref.quietHoursStart} - ${pref.quietHoursEnd}).`
        };
      }
    }

    // Passed all gates! Save to in_app_notifications
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 16);
    const insertRes = await db.query(`
      INSERT INTO in_app_notifications (
        id, user_id, title, message, type, is_read, status
      ) VALUES ($1, $2, $3, $4, $5, FALSE, 'delivered')
      RETURNING *
    `, [notifId, userId, title, message, type]);

    const n = insertRes.rows[0];
    return {
      delivered: true,
      notification: {
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at
      }
    };
  },

  /**
   * Fetch delivered notifications for a user
   */
  async getDeliveredNotifications(userId, limit = 50) {
    const res = await db.query(`
      SELECT * FROM in_app_notifications
      WHERE user_id = $1 AND status = 'delivered'
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    const countRes = await db.query(`
      SELECT COUNT(*)::int as unread_count
      FROM in_app_notifications
      WHERE user_id = $1 AND status = 'delivered' AND is_read = FALSE
    `, [userId]);

    return {
      unreadCount: countRes.rows[0]?.unread_count || 0,
      notifications: res.rows.map(r => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        isRead: r.is_read,
        createdAt: r.created_at
      }))
    };
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    const res = await db.query(`
      UPDATE in_app_notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    return res.rows.length > 0;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await db.query(`
      UPDATE in_app_notifications
      SET is_read = TRUE
      WHERE user_id = $1
    `, [userId]);

    return true;
  },

  /**
   * Retrieve immutable consent audit history for a user
   */
  async getConsentHistory(userId) {
    const res = await db.query(`
      SELECT * FROM notification_consent_audit
      WHERE user_id = $1
      ORDER BY consent_timestamp DESC
      LIMIT $2
    `, [userId, NOTIFICATION_CONFIG.CONSENT_AUDIT_RETENTION_LIMIT || 20]);

    return res.rows.map(r => ({
      id: r.id,
      action: r.action,
      previousOptIn: r.previous_opt_in,
      newOptIn: r.new_opt_in,
      consentTimestamp: r.consent_timestamp,
      clientIp: r.client_ip
    }));
  }
};
