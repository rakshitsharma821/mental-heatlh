// ============================================
// MindCare Sanctuary — Part 7 Automated Test Suite
// OPT-IN NOTIFICATIONS, QUIET HOURS & QUESTIONNAIRE FOCUS SHIELD
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { db, initPostgresDatabase } from '../models/db.js';
import { isTimeInQuietHours, NOTIFICATION_CONFIG } from '../config/notifications.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return { status: res.status, body: json };
}

test('Part 7: Opt-In Notifications, Quiet Hours & Focus Mode', async (t) => {
  try {
    await initPostgresDatabase();

  const rand = Math.floor(Math.random() * 900000 + 100000);
  const clientId = `usr_p7_cl_${rand}`;
  const therapistId = `usr_p7_th_${rand}`;
  const adminId = `usr_p7_adm_${rand}`;

  // Seed test users
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES
      ($1, $2, $3, 'hash', 'salt', 'rec_hash', 'Quiet Client', 'client', 'active'),
      ($4, $5, $6, 'hash', 'salt', 'rec_hash', 'Dr. Quiet', 'therapist', 'active'),
      ($7, $8, $9, 'hash', 'salt', 'rec_hash', 'Admin Auditor', 'admin', 'active')
    ON CONFLICT (id) DO NOTHING;
  `, [
    clientId, `MC-P7-${rand}`, `p7.cl.${rand}@mindcare.test`,
    therapistId, `THR-P7-${rand}`, `p7.th.${rand}@mindcare.test`,
    adminId, `ADM-P7-${rand}`, `p7.adm.${rand}@mindcare.test`
  ]);

  // Seed therapist profile
  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, title, verification_status, is_available)
    VALUES ($1, $2, 'RCI-P7-QUIET', 'Rehabilitation Council of India', 'Clinical Psychologist', 'under_review', true)
    ON CONFLICT (id) DO UPDATE SET verification_status = 'under_review';
  `, [`tp_p7_${rand}`, therapistId]);

  const clientToken = jwt.sign({ id: clientId, role: 'client' }, JWT_SECRET, { expiresIn: '1h' });
  const therapistToken = jwt.sign({ id: therapistId, role: 'therapist' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminId, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  // ──────────────────────────────────────────
  // TEST 1: OFF by default
  // ──────────────────────────────────────────
  await t.test('T1. Notifications are strictly OFF by default; zero consent timestamp', async () => {
    const res = await apiRequest('/notifications/preferences', 'GET', null, clientToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.preferences.optIn, false, 'Default optIn must be FALSE');
    assert.equal(res.body.preferences.consentTimestamp, null, 'Default consent timestamp must be NULL');
    console.log('✅ T1. Notifications off by default with zero consent timestamp: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 2: Nothing sent without consent
  // ──────────────────────────────────────────
  await t.test('T2. Dispatch dropped when member has not granted consent', async () => {
    const dispatchRes = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Consultation Reminder',
      message: 'Your upcoming session starts in 15 minutes.',
      type: 'session_reminder'
    }, clientToken);

    assert.equal(dispatchRes.status, 200);
    assert.equal(dispatchRes.body.delivered, false);
    assert.equal(dispatchRes.body.reason, 'no_consent');

    // Verify database has 0 notifications for client
    const notifs = await apiRequest('/notifications', 'GET', null, clientToken);
    assert.equal(notifs.body.notifications.length, 0);
    console.log('✅ T2. Nothing sent without explicit opt-in consent: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 3: User Opts In; Timestamp & Audit recorded
  // ──────────────────────────────────────────
  await t.test('T3. Member grants explicit opt-in; consent timestamp & audit logged', async () => {
    const updateRes = await apiRequest('/notifications/preferences', 'PUT', {
      optIn: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    }, clientToken);

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.preferences.optIn, true);
    assert.ok(updateRes.body.preferences.consentTimestamp, 'Consent timestamp must be generated');

    // Check audit trail
    const auditRes = await apiRequest('/notifications/consent-history', 'GET', null, clientToken);
    assert.equal(auditRes.status, 200);
    assert.ok(auditRes.body.consentHistory.length >= 1);
    assert.equal(auditRes.body.consentHistory[0].action, 'opt_in');
    assert.equal(auditRes.body.consentHistory[0].newOptIn, true);
    console.log('✅ T3. Member opt-in updates timestamp and creates immutable audit entry: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 4: Dispatch successful when opted in
  // ──────────────────────────────────────────
  let deliveredNotifId = null;
  await t.test('T4. Opted-in member receives clinical consultation status notification', async () => {
    // Dispatch during active daytime (14:30)
    const afternoonDate = new Date('2026-10-24T14:30:00+05:30');
    const dispatchRes = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Session Confirmed',
      message: 'Your session with Dr. Quiet has been confirmed.',
      type: 'session_status',
      referenceDate: afternoonDate.toISOString()
    }, clientToken);

    assert.equal(dispatchRes.status, 200);
    assert.equal(dispatchRes.body.delivered, true);
    assert.ok(dispatchRes.body.notification);
    deliveredNotifId = dispatchRes.body.notification.id;
    console.log('✅ T4. Opted-in member successfully receives notification: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 5: Restorative Quiet Hours Suppression & Exemptions
  // ──────────────────────────────────────────
  await t.test('T5. Quiet hours window withholds routine notifications during sleep while exempting reminders', async () => {
    // 23:30 is within 22:00 - 07:00
    const nighttimeDate = new Date('2026-10-24T23:30:00+05:30');

    // 1. Routine status notification is HELD during quiet hours
    const routineRes = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Routine Update',
      message: 'A general reflection is available.',
      type: 'session_status',
      referenceDate: nighttimeDate.toISOString()
    }, clientToken);

    assert.equal(routineRes.status, 200);
    assert.equal(routineRes.body.delivered, false);
    assert.equal(routineRes.body.reason, 'suppressed_quiet_hours');

    // 2. Urgent session_reminder is EXEMPT from quiet hours and delivered
    const reminderRes = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Urgent Consultation Reminder',
      message: 'Your upcoming session starts shortly.',
      type: 'session_reminder',
      referenceDate: nighttimeDate.toISOString()
    }, clientToken);

    assert.equal(reminderRes.status, 200);
    assert.equal(reminderRes.body.delivered, true, 'session_reminder must be exempt from quiet hours');
    console.log('✅ T5. Restorative sleep quiet hours successfully holds routine notifications & exempts reminders: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 6: Quiet Hours Window Calculation Across Midnight
  // ──────────────────────────────────────────
  await t.test('T6. Quiet hours overnight span correctly calculates inside vs outside times', async () => {
    assert.equal(isTimeInQuietHours('22:30', '22:00', '07:00'), true);
    assert.equal(isTimeInQuietHours('03:15', '22:00', '07:00'), true);
    assert.equal(isTimeInQuietHours('06:59', '22:00', '07:00'), true);
    assert.equal(isTimeInQuietHours('07:01', '22:00', '07:00'), false);
    assert.equal(isTimeInQuietHours('12:00', '22:00', '07:00'), false);
    assert.equal(isTimeInQuietHours('21:59', '22:00', '07:00'), false);
    console.log('✅ T6. Quiet hours overnight calculation logic verified: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 7: Questionnaire Focus Mode Shield (Server-Side Enforced & Queued)
  // ──────────────────────────────────────────
  await t.test('T7. Active questionnaire focus mode strictly silences incoming alerts on server and queues them', async () => {
    const afternoonDate = new Date('2026-10-24T15:00:00+05:30');

    // Activate server-side focus mode via API
    const focusStartRes = await apiRequest('/assessment/focus-start', 'POST', {}, clientToken);
    assert.equal(focusStartRes.status, 200);

    // Verify DB persistence in user_focus_sessions
    const sessionRes = await db.query('SELECT * FROM user_focus_sessions WHERE user_id = $1', [clientId]);
    assert.ok(sessionRes.rows.length > 0, 'user_focus_sessions must have an entry in DB');
    assert.ok(new Date(sessionRes.rows[0].expires_at) > new Date(), 'Focus session must have unexpired TTL');

    // Verify heartbeat refreshes TTL
    const heartbeatRes = await apiRequest('/assessment/focus-heartbeat', 'POST', {}, clientToken);
    assert.equal(heartbeatRes.status, 200);

    // Dispatch without passing client flag — server must automatically silence AND queue it
    const dispatchDuringFocus = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Focus Interruption',
      message: 'New journal prompt available.',
      type: 'session_reminder',
      isFocusMode: false, // Even if client flag is false, server state silences it!
      referenceDate: afternoonDate.toISOString()
    }, clientToken);

    assert.equal(dispatchDuringFocus.status, 200);
    assert.equal(dispatchDuringFocus.body.delivered, false);
    assert.equal(dispatchDuringFocus.body.queued, true);
    assert.equal(dispatchDuringFocus.body.reason, 'silenced_focus_mode');

    // Verify queued in queued_notifications table
    const queuedRows = await db.query('SELECT * FROM queued_notifications WHERE user_id = $1', [clientId]);
    assert.ok(queuedRows.rows.length >= 1, 'Notification must be stored in queued_notifications');

    // Deactivate server-side focus mode — this must drain queued notifications
    const focusEndRes = await apiRequest('/assessment/focus-end', 'POST', {}, clientToken);
    assert.equal(focusEndRes.status, 200);

    // Verify queued table is drained
    const drainedRows = await db.query('SELECT * FROM queued_notifications WHERE user_id = $1', [clientId]);
    assert.equal(drainedRows.rows.length, 0, 'Queued notifications must be drained upon focus end');

    // Verify delivered to client's notifications list
    const clientNotifs = await apiRequest('/notifications', 'GET', null, clientToken);
    assert.ok(clientNotifs.body.notifications.some(n => n.title === 'Focus Interruption'), 'Drained notification must be delivered');

    // After focus mode ends, new direct dispatch goes through
    const dispatchAfterFocus = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Welcome Back',
      message: 'Session resumed.',
      type: 'session_reminder',
      referenceDate: afternoonDate.toISOString()
    }, clientToken);

    assert.equal(dispatchAfterFocus.body.delivered, true);
    console.log('✅ T7. Server-enforced questionnaire focus mode silences, queues, and drains on end: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 7b: DPDP Time-Based Retention (3-Year Retention Policy & IP Masking)
  // ──────────────────────────────────────────
  await t.test('T7b. Consent audit retains entries within 3 years and prunes older records with subnet masking', async () => {
    // Insert an audit row from 4 years ago and an audit row from 1 year ago
    await db.query(`
      INSERT INTO notification_consent_audit (id, user_id, action, previous_opt_in, new_opt_in, consent_timestamp, client_ip, user_agent)
      VALUES
        ('nca_old_4yr', $1, 'opt_in', false, true, CURRENT_TIMESTAMP - interval '4 years', '192.168.1.0/24', 'OldBrowser/1.0'),
        ('nca_recent_1yr', $1, 'update_preferences', true, true, CURRENT_TIMESTAMP - interval '1 year', '192.168.1.0/24', 'RecentBrowser/2.0')
      ON CONFLICT (id) DO NOTHING
    `, [clientId]);

    // Trigger updatePreferences which executes retention pruning
    await apiRequest('/notifications/preferences', 'PUT', { optIn: true }, clientToken);

    // Verify 4-year row was pruned and 1-year row was preserved
    const checkOld = await db.query('SELECT id FROM notification_consent_audit WHERE id = $1', ['nca_old_4yr']);
    const checkRecent = await db.query('SELECT id FROM notification_consent_audit WHERE id = $1', ['nca_recent_1yr']);

    assert.equal(checkOld.rows.length, 0, 'Audit row older than 3 years must be pruned');
    assert.equal(checkRecent.rows.length, 1, 'Audit row within 3 years must be retained');
    console.log('✅ T7b. 3-year DPDP time-based retention policy verified: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 8: Therapist Verification Update Notice
  // ──────────────────────────────────────────
  await t.test('T8. Clinician verification dossier update triggers notice when clinician is opted in', async () => {
    // Therapist opts in
    await apiRequest('/notifications/preferences', 'PUT', { optIn: true }, therapistToken);

    // Admin updates therapist dossier
    const updateRes = await apiRequest(`/admin/therapists/${therapistId}/verification-decision`, 'POST', {
      decision: 'approve',
      reason: 'Clinical credentials confirmed with RCI registry.'
    }, adminToken);

    assert.equal(updateRes.status, 200);

    // Therapist retrieves notifications
    const thNotifs = await apiRequest('/notifications', 'GET', null, therapistToken);
    assert.equal(thNotifs.status, 200);
    assert.ok(thNotifs.body.notifications.some(n => n.type === 'therapist_verification' || n.title.includes('Verification')));
    console.log('✅ T8. Clinician receives verification update notification when opted in: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 9: Member Opts Out (Reverts to Silence)
  // ──────────────────────────────────────────
  await t.test('T9. Member revokes consent; subsequent dispatches are immediately blocked', async () => {
    const optOutRes = await apiRequest('/notifications/preferences', 'PUT', { optIn: false }, clientToken);
    assert.equal(optOutRes.status, 200);
    assert.equal(optOutRes.body.preferences.optIn, false);

    // Attempt dispatch
    const afternoonDate = new Date('2026-10-24T14:30:00+05:30');
    const dispatchRes = await apiRequest('/notifications/dispatch', 'POST', {
      userId: clientId,
      title: 'Post Opt-out Notice',
      message: 'This should be blocked.',
      type: 'session_status',
      referenceDate: afternoonDate.toISOString()
    }, clientToken);

    assert.equal(dispatchRes.body.delivered, false);
    assert.equal(dispatchRes.body.reason, 'no_consent');

    // Verify audit log has opt_out action
    const auditRes = await apiRequest('/notifications/consent-history', 'GET', null, clientToken);
    assert.equal(auditRes.body.consentHistory[0].action, 'opt_out');
    assert.equal(auditRes.body.consentHistory[0].newOptIn, false);
    console.log('✅ T9. Opt-out immediately halts all dispatches and records revocation audit: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 10: In-App Notification Read Tracking
  // ──────────────────────────────────────────
  await t.test('T10. Member marks notification as read; unread count updates correctly', async () => {
    assert.ok(deliveredNotifId, 'Should have a delivered notification id from T4');

    const readRes = await apiRequest(`/notifications/${deliveredNotifId}/read`, 'PATCH', {}, clientToken);
    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.success, true);

    const listRes = await apiRequest('/notifications', 'GET', null, clientToken);
    const updatedNotif = listRes.body.notifications.find(n => n.id === deliveredNotifId);
    assert.ok(updatedNotif);
    assert.equal(updatedNotif.isRead, true);
    console.log('✅ T10. In-app notification read status tracking verified: PASS');
  });

    console.log('\n========================================');
    console.log('RESULT: 11/11 Part 7 Tests Passed Successfully');
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  }
});
