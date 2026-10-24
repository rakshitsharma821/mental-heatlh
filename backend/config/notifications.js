// ============================================
// MindCare Sanctuary — Notification Configuration (Part 7)
// Safe, Opt-in Only, Respectful of Restorative Sleep & Focus Mode
// ============================================

export const NOTIFICATION_CONFIG = {
  DEFAULT_OPT_IN: false, // Strictly OFF by default
  DEFAULT_QUIET_HOURS_ENABLED: true,
  DEFAULT_QUIET_HOURS_START: process.env.QUIET_HOURS_START || '22:00', // 10:00 PM
  DEFAULT_QUIET_HOURS_END: process.env.QUIET_HOURS_END || '07:00',     // 7:00 AM
  
  TYPES: {
    SESSION_STATUS: 'session_status',
    SESSION_REMINDER: 'session_reminder',
    THERAPIST_VERIFICATION: 'therapist_verification',
    COMMUNITY: 'community',
    SYSTEM: 'system'
  },

  // Types strictly exempt from quiet hours so critical appointment alerts and clinician review notices reach the user
  EXEMPT_FROM_QUIET_HOURS: [
    'session_reminder',
    'therapist_verification'
  ],

  // Data minimization & retention limit for consent audit log (DPDP Act compliance)
  CONSENT_AUDIT_RETENTION_LIMIT: 20, // Maximum audit records preserved per user
  CONSENT_AUDIT_RETENTION_DAYS: 90   // Days before older records are purged
};

/**
 * Checks if a given time "HH:MM" falls within the quiet hours window [start, end].
 * Handles overnight spans across midnight (e.g., 22:00 to 07:00).
 */
export function isTimeInQuietHours(timeStr, startStr = NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_START, endStr = NOTIFICATION_CONFIG.DEFAULT_QUIET_HOURS_END) {
  if (!timeStr || !startStr || !endStr) return false;

  const [h, m] = timeStr.split(':').map(Number);
  const currentMinutes = h * 60 + m;

  const [sh, sm] = startStr.split(':').map(Number);
  const startMinutes = sh * 60 + sm;

  const [eh, em] = endStr.split(':').map(Number);
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    // Normal window in same day (e.g. 01:00 to 05:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Spanning midnight (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
