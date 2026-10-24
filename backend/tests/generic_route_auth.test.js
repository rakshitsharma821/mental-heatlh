// ============================================
// MindCare Sanctuary — Generic Route Authorization Test Suite
// Item 7 Audit: Enumerates every Express route protecting client-private resources
// Verifies: (a) Admin token gets 403/404,
//           (b) Unassigned Therapist token gets 403/404,
//           (c) Another Client's token (Client B) gets 403/404.
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { db, initPostgresDatabase } from '../models/db.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  let json = {};
  try {
    json = await res.json();
  } catch (_) {}

  return { status: res.status, body: json };
}

test('Item 7: Generic Route Authorization Matrix Audit', async (t) => {
  try {
    await initPostgresDatabase();

  const rand = Math.floor(Math.random() * 900000 + 100000);
  const clientAId = `usr_auth_cla_${rand}`;
  const clientBId = `usr_auth_clb_${rand}`;
  const therapistId = `usr_auth_th_${rand}`;
  const otherTherapistId = `usr_auth_oth_${rand}`;
  const adminId = `usr_auth_adm_${rand}`;

  // 1. Seed users
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES
      ($1, $2, $3, 'hash', 'salt', 'rec_hash', 'Client Alice', 'client', 'active'),
      ($4, $5, $6, 'hash', 'salt', 'rec_hash', 'Client Bob', 'client', 'active'),
      ($7, $8, $9, 'hash', 'salt', 'rec_hash', 'Dr. Unassigned', 'therapist', 'active'),
      ($10, $11, $12, 'hash', 'salt', 'rec_hash', 'Dr. Assigned Other', 'therapist', 'active'),
      ($13, $14, $15, 'hash', 'salt', 'rec_hash', 'Admin Super', 'admin', 'active')
    ON CONFLICT (id) DO NOTHING;
  `, [
    clientAId, `MC-CLA-${rand}`, `cla.${rand}@mindcare.test`,
    clientBId, `MC-CLB-${rand}`, `clb.${rand}@mindcare.test`,
    therapistId, `THR-TH_${rand}`, `th.${rand}@mindcare.test`,
    otherTherapistId, `THR-OTH_${rand}`, `oth.${rand}@mindcare.test`,
    adminId, `ADM-ADM_${rand}`, `adm.${rand}@mindcare.test`
  ]);

  // Seed therapist profile (approved status, but NOT assigned to Client A)
  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, title, verification_status, is_available)
    VALUES ($1, $2, 'RCI-AUTH-TEST', 'RCI India', 'Clinical Psychologist', 'approved', true)
    ON CONFLICT (id) DO NOTHING;
  `, [`tp_auth_${rand}`, therapistId]);

  // 2. Seed Client A private resources
  const journalAId = `jrn_auth_${rand}`;
  await db.query(`
    INSERT INTO journal_entries (id, user_id, encrypted_content, iv, auth_tag, sentiment_tag, created_at)
    VALUES ($1, $2, 'enc_journal', 'iv', 'tag', 'reflective', CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING;
  `, [journalAId, clientAId]);

  const docAId = `doc_auth_${rand}`;
  await db.query(`
    INSERT INTO therapist_documents (id, therapist_id, doc_type, original_filename, file_size, mime_type, storage_key)
    VALUES ($1, $2, 'rci_license', 'cert.pdf', 1024, 'application/pdf', 'auth/cert.pdf')
    ON CONFLICT (id) DO NOTHING;
  `, [docAId, therapistId]);

  const bookingAId = `sb_auth_${rand}`;
  await db.query(`
    INSERT INTO session_bookings (id, client_id, therapist_id, mode, slot_duration_minutes, preferred_slot, status)
    VALUES ($1, $2, $3, 'video', 45, CURRENT_TIMESTAMP, 'confirmed')
    ON CONFLICT (id) DO NOTHING;
  `, [bookingAId, clientAId, otherTherapistId]);

  const notifAId = `notif_auth_${rand}`;
  await db.query(`
    INSERT INTO in_app_notifications (id, user_id, title, message, type, is_read, status)
    VALUES ($1, $2, 'Private Notification', 'Private text', 'system', false, 'delivered')
    ON CONFLICT (id) DO NOTHING;
  `, [notifAId, clientAId]);

  const clientAToken = jwt.sign({ id: clientAId, role: 'client' }, JWT_SECRET, { expiresIn: '1h' });
  const clientBToken = jwt.sign({ id: clientBId, role: 'client' }, JWT_SECRET, { expiresIn: '1h' });
  const unassignedTherapistToken = jwt.sign({ id: therapistId, role: 'therapist' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminId, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  // 3. Define the comprehensive route audit matrix
  // Each target represents a client-private resource or action belonging to Client A
  const auditRoutes = [
    {
      name: 'Mood History',
      method: 'GET',
      path: '/mood/history',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Mood Analytics',
      method: 'GET',
      path: '/mood/analytics',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Activity Logging',
      method: 'POST',
      path: '/activity',
      body: { activity_type: 'mindful_breathing', duration_seconds: 180 },
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Journal Read',
      method: 'GET',
      path: '/journal',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Client A Journal Delete by Client B',
      method: 'DELETE',
      path: `/journal/${journalAId}`,
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [404] }
      ]
    },
    {
      name: 'Therapy Roadmap',
      method: 'GET',
      path: '/roadmap',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'AI Companion Memories',
      method: 'GET',
      path: '/companion/memory',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'AI Companion Chat',
      method: 'POST',
      path: '/companion/chat',
      body: { message: 'Hello Aria' },
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Assessment Latest Outcome',
      method: 'GET',
      path: '/assessment/latest',
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    },
    {
      name: 'Clinical Treatment Plan for Client A',
      method: 'GET',
      path: `/clinical/treatment-plan/${clientAId}`,
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Clinical Evaluation Update for Client A',
      method: 'PATCH',
      path: `/clinical/evaluation/${clientAId}`,
      body: { requiresFurtherEvaluation: true, clinicalNotes: 'Confidential clinical diagnosis' },
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Clinical Chat Messages in Client A Session Room',
      method: 'GET',
      path: `/clinical/messages/${bookingAId}`,
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Session State History for Client A',
      method: 'GET',
      path: `/clinical/session-requests/${bookingAId}/history`,
      body: null,
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Cancel Client A Session Booking',
      method: 'PATCH',
      path: `/clinical/session-requests/${bookingAId}/cancel`,
      body: { reason: 'Unauthorized cancellation' },
      unauthorizedRoles: [
        { role: 'Admin', token: adminToken, expected: [403] },
        { role: 'Unassigned Therapist', token: unassignedTherapistToken, expected: [403] },
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Therapist Verification Document Signed URL by Client B',
      method: 'GET',
      path: `/clinical/documents/${docAId}/signed-url`,
      body: null,
      unauthorizedRoles: [
        { role: 'Other Client (Client B)', token: clientBToken, expected: [403] }
      ]
    },
    {
      name: 'Client A Notification Read by Client B',
      method: 'PATCH',
      path: `/notifications/${notifAId}/read`,
      body: {},
      unauthorizedRoles: [
        { role: 'Other Client (Client B)', token: clientBToken, expected: [404] }
      ]
    },
    {
      name: 'Community Admin Features Toggle by Non-Admin',
      method: 'POST',
      path: '/community/admin/features',
      body: { enablePeerMatching: true },
      unauthorizedRoles: [
        { role: 'Client', token: clientBToken, expected: [403] },
        { role: 'Therapist', token: unassignedTherapistToken, expected: [403] }
      ]
    }
  ];

  console.log('\n================================================================================================');
  console.log('ITEM 7 GENERIC ROUTE AUTHORIZATION AUDIT MATRIX');
  console.log('================================================================================================');
  console.log(String('Route / Resource').padEnd(42) + ' | ' + String('Unauthorized Role').padEnd(25) + ' | Expected | Got | Status');
  console.log('------------------------------------------------------------------------------------------------');

  let totalChecks = 0;
  let passedChecks = 0;

  for (const r of auditRoutes) {
    for (const testRole of r.unauthorizedRoles) {
      totalChecks++;
      await t.test(`${r.name} blocked for ${testRole.role}`, async () => {
        const res = await req(r.method, r.path, r.body, testRole.token);
        const pass = testRole.expected.includes(res.status);
        if (pass) passedChecks++;

        const printStatus = pass ? 'PASS ✅' : 'FAIL ❌';
        console.log(
          String(`${r.method} ${r.path}`).slice(0, 42).padEnd(42) + ' | ' +
          String(testRole.role).padEnd(25) + ' | ' +
          String(testRole.expected.join('/')).padEnd(8) + ' | ' +
          String(res.status).padEnd(3) + ' | ' +
          printStatus
        );

        assert.ok(
          testRole.expected.includes(res.status),
          `Expected ${r.method} ${r.path} for ${testRole.role} to return ${testRole.expected.join('/')}, got ${res.status}`
        );
      });
    }
  }

  console.log('================================================================================================');
  console.log(`TOTAL GENERIC ROUTE AUTHORIZATION CHECKS PASSED: ${passedChecks}/${totalChecks}`);
  console.log('================================================================================================\n');

  assert.equal(passedChecks, totalChecks, 'All generic route authorization checks must pass');
  process.exit(0);
  } catch (err) {
    console.error('GENERIC ROUTE AUTH SETUP/EXEC ERROR:', err);
    process.exit(1);
  }
});
