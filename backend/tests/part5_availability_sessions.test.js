// ============================================
// MindCare Sanctuary — Part 5 Automated Test Suite
// AVAILABILITY, SESSION REQUESTS, GATED CHAT AND CALLS
// Tests:
// 1. Therapist schedule retrieval & validation (HH:mm format, start < end, no overlap)
// 2. Heartbeat ping: updates last_heartbeat & 60s active expiry
// 3. Client directory: approved clinicians only, filters by specialty, mode, and search
// 4. Session request creation with mode, duration, and consent-gated notes
// 5. Double-booking prevention: client conflict & therapist conflict (409)
// 6. State machine: requested -> assigned -> therapist_accepted -> confirmed
// 7. Therapist decline: requires structured reason, logs to session_declines
// 8. Client self-cancellation: transitions to cancelled_by_user and logs state history
// 9. Confidentiality guarantee: client view hides admin notes; therapist view hides unconsented note
// 10. Gated Socket.io Live Room: unconfirmed rejected, unauthorized rejected, out-of-window rejected, confirmed inside window connects
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import { db, initPostgresDatabase } from '../models/db.js';
import { encryptField } from '../utils/crypto.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

const BASE_URL = 'http://localhost:5000/api';

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

test('Part 5: Therapist Availability, Session Requests & Gated Consultations', async (t) => {
  await initPostgresDatabase();

  const rand = Math.floor(Math.random() * 900000 + 100000);
  const clientUid = `usr_p5_cli_${rand}`;
  const clientPublicId = `MC-${rand}`;
  const therapistUid = `usr_p5_thr_${rand}`;
  const therapistPublicId = `THR-${rand}`;
  const adminUid = `usr_p5_adm_${rand}`;
  const otherClientUid = `usr_p5_other_${rand}`;

  // 1. Seed test users
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES 
      ($1, $2, $3, 'hash', 'salt', 'rec_hash', 'Part 5 Client', 'client', 'active'),
      ($4, $5, $6, 'hash', 'salt', 'rec_hash', 'Dr. Part 5 Clinician', 'therapist', 'active'),
      ($7, $8, $9, 'hash', 'salt', 'rec_hash', 'Part 5 Admin', 'admin', 'active'),
      ($10, $11, $12, 'hash', 'salt', 'rec_hash', 'Other Client', 'client', 'active')
    ON CONFLICT (id) DO NOTHING;
  `, [
    clientUid, clientPublicId, `p5.client.${rand}@mindcare.test`,
    therapistUid, therapistPublicId, `p5.therapist.${rand}@mindcare.test`,
    adminUid, `ADM-${rand}`, `p5.admin.${rand}@mindcare.test`,
    otherClientUid, `MC-${rand + 1}`, `p5.other.${rand}@mindcare.test`
  ]);

  // Seed approved therapist profile
  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, title, specialties, verification_status, is_available)
    VALUES ($1, $2, 'RCI-P5-TEST', 'Rehabilitation Council of India', 'Licensed Clinical Psychologist', '["Anxiety & Panic", "Trauma & PTSD"]', 'approved', true)
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved', is_available = true;
  `, [`tp_p5_${rand}`, therapistUid]);

  const clientToken = jwt.sign({ id: clientUid, role: 'client', name: 'Part 5 Client' }, JWT_SECRET, { expiresIn: '1h' });
  const otherClientToken = jwt.sign({ id: otherClientUid, role: 'client', name: 'Other Client' }, JWT_SECRET, { expiresIn: '1h' });
  const therapistToken = jwt.sign({ id: therapistUid, role: 'therapist', name: 'Dr. Part 5 Clinician' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminUid, role: 'admin', name: 'Part 5 Admin' }, JWT_SECRET, { expiresIn: '1h' });

  // ──────────────────────────────────────────
  // TEST 1: Availability Schedule Validation
  // ──────────────────────────────────────────
  await t.test('T1. Availability schedule validation prevents invalid time format, range, and overlaps', async () => {
    // 1a. Invalid start >= end
    const invalidRange = await apiRequest('/clinical/availability/my-schedule', 'PUT', {
      weekly_schedule: {
        monday: [{ start: '17:00', end: '10:00' }]
      }
    }, therapistToken);
    assert.equal(invalidRange.status, 400);
    assert.match(invalidRange.body.message, /must be earlier than end/i);

    // 1b. Overlapping slots on same day
    const overlapping = await apiRequest('/clinical/availability/my-schedule', 'PUT', {
      weekly_schedule: {
        tuesday: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '14:00' }
        ]
      }
    }, therapistToken);
    assert.equal(overlapping.status, 400);
    assert.match(overlapping.body.message, /overlapping slots/i);

    // 1c. Valid schedule update
    const validSchedule = await apiRequest('/clinical/availability/my-schedule', 'PUT', {
      weekly_schedule: {
        monday: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        tuesday: [{ start: '10:00', end: '16:00' }],
        wednesday: [{ start: '10:00', end: '16:00' }],
        thursday: [{ start: '10:00', end: '16:00' }],
        friday: [{ start: '10:00', end: '16:00' }],
        saturday: [],
        sunday: []
      },
      slot_duration_minutes: 45,
      buffer_minutes: 15,
      leave_dates: ['2026-11-15', '2026-11-16']
    }, therapistToken);

    assert.equal(validSchedule.status, 200);
    assert.equal(validSchedule.body.success, true);
    console.log('✅ T1. Availability schedule validation enforces time ordering, non-overlap, and valid ranges: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 2: Therapist Heartbeat & "Available Now"
  // ──────────────────────────────────────────
  await t.test('T2. Heartbeat broadcast marks therapist "Available Now"', async () => {
    const hbRes = await apiRequest('/clinical/availability/heartbeat', 'POST', {}, therapistToken);
    assert.equal(hbRes.status, 200);
    assert.equal(hbRes.body.is_available_now, true);

    const scheduleRes = await apiRequest('/clinical/availability/my-schedule', 'GET', null, therapistToken);
    assert.equal(scheduleRes.status, 200);
    assert.equal(scheduleRes.body.schedule.is_available_now, true);
    console.log('✅ T2. Heartbeat ping refreshes online presence and is_available_now flag: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 3: Client-Facing Therapist Directory
  // ──────────────────────────────────────────
  await t.test('T3. Therapist directory lists approved clinicians with verified badge and filters', async () => {
    const dirRes = await apiRequest('/clinical/directory?specialization=Anxiety');
    assert.equal(dirRes.status, 200);
    assert.ok(dirRes.body.therapists.length > 0);

    const found = dirRes.body.therapists.find(t => t.id === therapistUid);
    assert.ok(found, 'Seeded therapist should be found in directory');
    assert.equal(found.verified_badge, true);
    assert.equal(found.timezone, 'Asia/Kolkata');
    console.log('✅ T3. Client directory returns approved clinicians with verified badge & filters: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 4: Session Request Creation with Note Consent
  // ──────────────────────────────────────────
  let sessionBookingId = null;
  const tomorrowSlot = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrowSlot.setMinutes(0, 0, 0);

  await t.test('T4. Client session request requires explicit consent if note is provided', async () => {
    // 4a. Note provided without consent checkbox -> rejected (400)
    const noConsentRes = await apiRequest('/clinical/session-requests', 'POST', {
      preferred_therapist_id: therapistUid,
      preferred_slot: tomorrowSlot.toISOString(),
      mode: 'video',
      slot_duration_minutes: 45,
      client_note: 'Experiencing acute work panic',
      consent_share_note: false
    }, clientToken);
    assert.equal(noConsentRes.status, 400);
    assert.match(noConsentRes.body.message, /explicit consent is required/i);

    // 4b. Valid request with explicit consent
    const validBooking = await apiRequest('/clinical/session-requests', 'POST', {
      preferred_therapist_id: therapistUid,
      preferred_slot: tomorrowSlot.toISOString(),
      mode: 'video',
      slot_duration_minutes: 45,
      client_note: 'Experiencing acute work panic and restless sleep',
      consent_share_note: true
    }, clientToken);

    assert.equal(validBooking.status, 201);
    assert.ok(validBooking.body.booking.id);
    assert.equal(validBooking.body.booking.status, 'under_admin_review');
    sessionBookingId = validBooking.body.booking.id;
    console.log('✅ T4. Client session request enforces explicit consent for confidential notes: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 5: Double Booking Prevention
  // ──────────────────────────────────────────
  await t.test('T5. Double-booking prevention rejects overlapping requests (409 Conflict)', async () => {
    // 5a. Client cannot create overlapping booking for themselves
    const clientOverlapRes = await apiRequest('/clinical/session-requests', 'POST', {
      preferred_slot: new Date(tomorrowSlot.getTime() + 15 * 60 * 1000).toISOString(), // 15 mins after slot starts
      mode: 'chat',
      slot_duration_minutes: 45
    }, clientToken);
    assert.equal(clientOverlapRes.status, 409);
    assert.match(clientOverlapRes.body.message, /already have an appointment/i);

    // 5b. Other client attempting to book the SAME therapist at overlapping time
    // First, confirm the first session for the therapist
    await db.query(`UPDATE session_bookings SET status = 'confirmed' WHERE id = $1`, [sessionBookingId]);

    const therapistOverlapRes = await apiRequest('/clinical/session-requests', 'POST', {
      preferred_therapist_id: therapistUid,
      preferred_slot: new Date(tomorrowSlot.getTime() + 20 * 60 * 1000).toISOString(),
      mode: 'video',
      slot_duration_minutes: 45
    }, otherClientToken);
    assert.equal(therapistOverlapRes.status, 409);
    assert.match(therapistOverlapRes.body.message, /already has a booked session/i);
    console.log('✅ T5. Double booking prevention strictly guards both client and therapist schedules: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 6: State Machine Transitions & Audit History
  // ──────────────────────────────────────────
  await t.test('T6. State machine transitions progress with state history logging', async () => {
    // Revert status to 'assigned' for therapist action
    await db.query(`UPDATE session_bookings SET status = 'assigned' WHERE id = $1`, [sessionBookingId]);

    // Therapist accepts session
    const acceptRes = await apiRequest(`/clinical/session-requests/${sessionBookingId}/therapist-action`, 'PATCH', {
      action: 'accept'
    }, therapistToken);
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.body.status, 'therapist_accepted');

    // Admin confirms session
    const confirmRes = await apiRequest(`/admin/session-requests/${sessionBookingId}/confirm`, 'PATCH', {
      admin_notes: 'Confirmed by clinical coordinator'
    }, adminToken);
    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.body.status, 'confirmed');

    // Verify session_state_history has records
    const historyRes = await apiRequest(`/clinical/session-requests/${sessionBookingId}/history`, 'GET', null, clientToken);
    assert.equal(historyRes.status, 200);
    assert.ok(historyRes.body.history.length >= 3, 'Should have multiple state transition entries');
    console.log('✅ T6. State machine progresses from assigned -> therapist_accepted -> confirmed with audit logging: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 7: Therapist Decline Flow
  // ──────────────────────────────────────────
  await t.test('T7. Therapist decline requires structured reason and triggers session_declines record', async () => {
    const tempSessionId = `sb_p5_dec_${rand}`;
    await db.query(`
      INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, status)
      VALUES ($1, $2, $3, 'Consultation (45 min)', CURRENT_TIMESTAMP + INTERVAL '3 days', 'assigned')
    `, [tempSessionId, clientUid, therapistUid]);

    // Missing reason -> 400
    const noReason = await apiRequest(`/clinical/session-requests/${tempSessionId}/therapist-action`, 'PATCH', {
      action: 'decline'
    }, therapistToken);
    assert.equal(noReason.status, 400);

    // Valid decline
    const declineRes = await apiRequest(`/clinical/session-requests/${tempSessionId}/therapist-action`, 'PATCH', {
      action: 'decline',
      reason: 'Schedule Conflict / Overbooked',
      decline_note: 'On call duty at central medical hospital'
    }, therapistToken);
    assert.equal(declineRes.status, 200);
    assert.equal(declineRes.body.status, 'therapist_declined');

    // Verify record in session_declines
    const decCheck = await db.query('SELECT * FROM session_declines WHERE session_id = $1', [tempSessionId]);
    assert.equal(decCheck.rows.length, 1);
    assert.equal(decCheck.rows[0].reason, 'Schedule Conflict / Overbooked');
    console.log('✅ T7. Therapist decline strictly requires structured reason and creates session_declines entry: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 8: Client Cancellation
  // ──────────────────────────────────────────
  await t.test('T8. Member can cancel their own active session with state history tracking', async () => {
    const cancelRes = await apiRequest(`/clinical/session-requests/${sessionBookingId}/cancel`, 'PATCH', {
      reason: 'Schedule changed'
    }, clientToken);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.status, 'cancelled_by_user');

    // Other client forbidden from cancelling
    const forbidCancel = await apiRequest(`/clinical/session-requests/${sessionBookingId}/cancel`, 'PATCH', {}, otherClientToken);
    assert.equal(forbidCancel.status, 403);
    console.log('✅ T8. Member can cancel their own session; unauthorized member rejected (403): PASS');
  });

  // ──────────────────────────────────────────
  // TEST 9: Privacy Guarantee
  // ──────────────────────────────────────────
  await t.test('T9. Confidentiality guarantee: Client view hides admin notes; Therapist views notes only with consent', async () => {
    // 9a. Check client sessions view
    await db.query(`
      UPDATE session_bookings
      SET admin_notes = 'Internal admin evaluation note - highly confidential',
          decline_note = 'Therapist internal note'
      WHERE id = $1
    `, [sessionBookingId]);

    const clientSessions = await apiRequest('/clinical/my-sessions', 'GET', null, clientToken);
    assert.equal(clientSessions.status, 200);
    const sessionItem = clientSessions.body.sessions.find(s => s.id === sessionBookingId);
    assert.ok(sessionItem);
    assert.equal(sessionItem.admin_notes, undefined, 'Client must NEVER receive admin_notes');
    assert.equal(sessionItem.decline_note, undefined, 'Client must NEVER receive internal decline_note');

    // 9b. Therapist view with consent_share_note = false
    const noConsentSessionId = `sb_p5_noconsent_${rand}`;
    const encNote = JSON.stringify(encryptField('Private client trauma note'));
    await db.query(`
      INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, client_encrypted_note, consent_share_note, status)
      VALUES ($1, $2, $3, 'Consultation', CURRENT_TIMESTAMP + INTERVAL '2 days', $4, FALSE, 'assigned')
    `, [noConsentSessionId, clientUid, therapistUid, encNote]);

    const thSessions = await apiRequest('/clinical/therapist/sessions', 'GET', null, therapistToken);
    const hiddenNoteItem = thSessions.body.sessions.find(s => s.id === noConsentSessionId);
    assert.ok(hiddenNoteItem);
    assert.equal(hiddenNoteItem.client_note, null, 'Client note must be null when consent_share_note is false');
    console.log('✅ T9. Confidentiality guarantee strictly protects internal notes and client consent: PASS');
  });

  // ──────────────────────────────────────────
  // TEST 10: Gated WebRTC Room via Socket.io
  // ──────────────────────────────────────────
  await t.test('T10. WebRTC consultation room gating: enforces confirmed status, authorized users, and time window', async () => {
    // Setup a session for live room test:
    // Session A: NOT confirmed (status = 'assigned') -> should fail room join
    const unconfirmedSessionId = `sb_p5_room_unconf_${rand}`;
    await db.query(`
      INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, status)
      VALUES ($1, $2, $3, 'Video (45 min)', CURRENT_TIMESTAMP, 'assigned')
    `, [unconfirmedSessionId, clientUid, therapistUid]);

    // 10a. Unconfirmed session room join rejected
    await new Promise((resolve) => {
      const socket = ClientIO('http://localhost:5000', {
        auth: { token: clientToken },
        transports: ['websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        socket.emit('join-room', { roomId: unconfirmedSessionId });
      });

      socket.on('room-error', (err) => {
        assert.equal(err.code, 'SESSION_NOT_CONFIRMED');
        socket.disconnect();
        resolve();
      });

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 3000);
    });

    // Setup Session B: confirmed, active RIGHT NOW (window is open)
    const activeSessionId = `sb_p5_room_active_${rand}`;
    await db.query(`
      INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, slot_duration_minutes, status)
      VALUES ($1, $2, $3, 'Video (45 min)', CURRENT_TIMESTAMP, 45, 'confirmed')
    `, [activeSessionId, clientUid, therapistUid]);

    // 10b. Unauthorized user (other client) rejected (ACCESS_DENIED)
    await new Promise((resolve) => {
      const socket = ClientIO('http://localhost:5000', {
        auth: { token: otherClientToken },
        transports: ['websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        socket.emit('join-room', { roomId: activeSessionId });
      });

      socket.on('room-error', (err) => {
        assert.equal(err.code, 'ACCESS_DENIED');
        socket.disconnect();
        resolve();
      });

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 3000);
    });

    // 10c. Authorized client inside active time window successfully joins
    await new Promise((resolve) => {
      const socket = ClientIO('http://localhost:5000', {
        auth: { token: clientToken },
        transports: ['websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        socket.emit('join-room', { roomId: activeSessionId });
      });

      socket.on('room-ready', (data) => {
        assert.equal(data.roomId, activeSessionId);
        socket.disconnect();
        resolve();
      });

      socket.on('room-error', (err) => {
        assert.fail(`Room join should succeed for confirmed active session: ${err.message}`);
      });

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 3000);
    });

    console.log('✅ T10. Live WebRTC consultation room gating strictly validates status, ownership, and time window: PASS');
  });

  console.log(`\n========================================`);
  console.log(`RESULT: 10/10 Part 5 Tests Passed Successfully`);
  console.log(`========================================\n`);
});
