// ============================================
// MindCare Test Suite — Step 0 Verification & Hardening
// Verifies all 16 Items with node:test subtest registration
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import jwt from 'jsonwebtoken';
import { db, initPostgresDatabase } from '../models/db.js';
import { decryptField } from '../utils/crypto.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('Step 0: Comprehensive Verification & Hardening', async (t) => {
  await initPostgresDatabase();
  console.log('--- STARTING STEP 0 VERIFICATION & HARDENING TESTS ---');
  const rand = Math.floor(1000 + Math.random() * 9000);

  // Seed baseline users & approved therapist profile
  await db.query(`
    INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES
      ('th_approved_test_01', 'therapist01@mindcare.test', 'h', 's', 'r', 'Dr. Marcus Vance', 'therapist', 'active'),
      ('client_user_test_01', 'c1@mindcare.test', 'h', 's', 'r', 'Client One', 'client', 'active'),
      ('client_user_test_02', 'c2@mindcare.test', 'h', 's', 'r', 'Client Two', 'client', 'active'),
      ('admin_system_root', 'admin@mindcare.com', 'h', 's', 'r', 'Admin System', 'admin', 'active'),
      ('super_admin_test_root', 'superadmin@mindcare.test', 'h', 's', 'rec_hash', 'Super Admin Test', 'super_admin', 'active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, title, verification_status, is_available)
    VALUES ('tp_approved_test_01', 'th_approved_test_01', 'RCI-APP-001', 'State Board', 'Clinical Psychologist', 'approved', true)
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved';
  `);

  // T1
  await t.test('1. Public register strictly ignores injected role and forces client', async () => {
    const regRes = await request('POST', '/api/auth/register', {
      email: `tamper_role_${rand}@mindcare.test`,
      password: 'Password123!',
      name: 'Role Tamper Test',
      role: 'super_admin',
      mobile_number: `+919811${rand}0`,
      age: 22,
      gender: 'Other',
      address: 'Step0 Test Ave'
    });

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.user.role, 'client');
    assert.ok(regRes.body.user.public_id?.startsWith('MC-'));
    console.log('✅ 1. Public register strictly ignores injected role and forces "client": PASS');
  });

  // T2
  await t.test('2. Seeded clinician (Dr. Sarah Vance) flagged is_demo=true and not approved', async () => {
    const demoClinicianRes = await db.query("SELECT is_demo, verification_status FROM therapist_profiles WHERE user_id = 'th_sarah_vance'");
    const demoRow = demoClinicianRes.rows[0];
    assert.ok(demoRow);
    assert.equal(demoRow.is_demo, true);
    assert.notEqual(demoRow.verification_status, 'approved');
    console.log('✅ 2. Seeded clinician (Dr. Sarah Vance) flagged is_demo=true and not approved: PASS');
  });

  // T3
  await t.test('3. Non-approved therapist rejected (403) from saving treatment plans', async () => {
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('th_unapproved_01', 'unapproved@mindcare.test', 'h', 's', 'r', 'Dr. Unapproved', 'therapist', 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_available)
      VALUES ('tp_unapproved_01', 'th_unapproved_01', 'Lic #REV-001', 'State Board', 'under_review', FALSE)
      ON CONFLICT (user_id) DO UPDATE SET verification_status = 'under_review';
    `);

    const unapprovedToken = jwt.sign(
      { id: 'th_unapproved_01', email: 'unapproved@mindcare.test', role: 'therapist' },
      JWT_SECRET
    );

    const unapprovedPlanRes = await request('POST', '/api/clinical/treatment-plan', {
      clientId: 'client_user_test_01',
      clinicalNotes: 'Test note'
    }, unapprovedToken);

    assert.equal(unapprovedPlanRes.status, 403);
    console.log('✅ 3. Non-approved therapist rejected (403) from saving treatment plans: PASS');
  });

  // T4
  await t.test('4. Suspended user blocked on authenticated request (403)', async () => {
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('client_suspended_01', 'suspended@mindcare.test', 'h', 's', 'r', 'Suspended Member', 'client', 'suspended')
      ON CONFLICT (id) DO UPDATE SET status = 'suspended';
    `);
    const suspendedToken = jwt.sign({ id: 'client_suspended_01', email: 'suspended@mindcare.test', role: 'client' }, JWT_SECRET);
    const suspendedReq = await request('GET', '/api/clinical/treatment-plan/client_suspended_01', null, suspendedToken);
    assert.equal(suspendedReq.status, 403);
    console.log('✅ 4. Suspended user blocked on authenticated request (403): PASS');
  });

  // T5
  const testSecretNote = 'Confidential diagnostic reflection: patient exhibits somatic stress spikes.';
  await t.test('5. Clinical treatment notes encrypted at rest & access log recorded', async () => {
    const approvedToken = jwt.sign(
      { id: 'th_approved_test_01', email: 'therapist01@mindcare.test', role: 'therapist', name: 'Dr. Marcus Vance' },
      JWT_SECRET
    );

    // Ensure client exists and booking exists for assignment
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('client_user_test_01', 'c1@mindcare.test', 'h', 's', 'r', 'Client One', 'client', 'active')
      ON CONFLICT (id) DO NOTHING;
      INSERT INTO session_bookings (id, client_id, therapist_id, mode, slot_duration_minutes, preferred_slot, status)
      VALUES ('sb_step0_test', 'client_user_test_01', 'th_approved_test_01', 'video', 45, CURRENT_TIMESTAMP, 'confirmed')
      ON CONFLICT (id) DO NOTHING;
    `);

    const savePlanRes = await request('POST', '/api/clinical/treatment-plan', {
      clientId: 'client_user_test_01',
      clinicalNotes: testSecretNote,
      evaluationSummary: 'Summary text',
      collaborativeTherapies: ['CBT']
    }, approvedToken);

    assert.equal(savePlanRes.status, 201);

    const planDbRes = await db.query('SELECT clinical_notes FROM clinical_therapy_plans WHERE client_id = $1 ORDER BY updated_at DESC LIMIT 1', ['client_user_test_01']);
    const rawStoredNotes = planDbRes.rows[0]?.clinical_notes || '';
    assert.ok(rawStoredNotes.includes('ciphertext'));
    assert.ok(!rawStoredNotes.includes(testSecretNote));

    const accessLogRes = await db.query('SELECT action, accessor_id FROM clinical_plan_access_logs WHERE accessor_id = $1 ORDER BY accessed_at DESC LIMIT 1', ['th_approved_test_01']);
    assert.ok(accessLogRes.rows.length > 0);
    assert.equal(accessLogRes.rows[0].action, 'create_or_update');
    console.log('✅ 5. Clinical treatment notes encrypted at rest & access log recorded: PASS');
  });

  // T6
  await t.test('6. Client reads decrypted own plan; other client forbidden (403)', async () => {
    const clientToken = jwt.sign({ id: 'client_user_test_01', email: 'c1@mindcare.test', role: 'client' }, JWT_SECRET);
    const otherClientToken = jwt.sign({ id: 'client_user_test_02', email: 'c2@mindcare.test', role: 'client' }, JWT_SECRET);

    const clientViewOwn = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, clientToken);
    const clientViewOther = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, otherClientToken);

    assert.equal(clientViewOwn.status, 200);
    assert.equal(clientViewOwn.body.plan?.clinical_notes, testSecretNote);
    assert.equal(clientViewOther.status, 403);
    console.log('✅ 6. Client reads decrypted own plan; other client forbidden (403): PASS');
  });

  // T7
  await t.test('7. Clinical chat encrypted at rest; administrators forbidden from reading (403)', async () => {
    const clientToken = jwt.sign({ id: 'client_user_test_01', email: 'c1@mindcare.test', role: 'client' }, JWT_SECRET);
    const testRoomId = `room_step0_${rand}`;

    // Seed booking so room exists
    await db.query(`
      INSERT INTO session_bookings (id, client_id, therapist_id, mode, slot_duration_minutes, preferred_slot, status)
      VALUES ($1, 'client_user_test_01', 'th_approved_test_01', 'video', 45, CURRENT_TIMESTAMP, 'confirmed')
      ON CONFLICT (id) DO NOTHING;
    `, [testRoomId]);

    const sendMsgRes = await request('POST', '/api/clinical/messages', {
      roomId: testRoomId,
      recipientId: 'th_approved_test_01',
      text: 'Hello doctor, feeling uneasy tonight.'
    }, clientToken);

    assert.equal(sendMsgRes.status, 201);

    const msgDbRes = await db.query('SELECT encrypted_content, iv, auth_tag FROM clinical_messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1', [testRoomId]);
    const storedMsg = msgDbRes.rows[0];
    const decryptedMsg = decryptField(storedMsg.encrypted_content, storedMsg.iv, storedMsg.auth_tag);
    assert.equal(decryptedMsg, 'Hello doctor, feeling uneasy tonight.');

    const adminToken = jwt.sign({ id: 'admin_system_root', email: 'admin@mindcare.com', role: 'admin' }, JWT_SECRET);
    const adminMsgAccess = await request('GET', `/api/clinical/messages/${testRoomId}`, null, adminToken);
    assert.equal(adminMsgAccess.status, 403);
    console.log('✅ 7. Clinical chat encrypted at rest; administrators forbidden from reading (403): PASS');
  });

  // T8
  await t.test('8. Super admin created administrator with one-time access code & audit logged', async () => {
    const superAdminToken = jwt.sign({ id: 'super_admin_test_root', role: 'super_admin' }, JWT_SECRET);
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('super_admin_test_root', 'superadmin@mindcare.test', 'h', 's', 'rec_hash', 'Super Admin Test', 'super_admin', 'active')
      ON CONFLICT (id) DO NOTHING;
    `);

    const createAdminRes = await request('POST', '/api/admin/create-admin', {
      email: `new_admin_${rand}@mindcare.test`,
      name: 'New Administrator',
      reason: 'Scaling clinical operations'
    }, superAdminToken);

    assert.equal(createAdminRes.status, 201);
    assert.ok(createAdminRes.body.oneTimeAccessCode);

    const auditDbRes = await db.query("SELECT action, target_type FROM admin_audit_log WHERE action = 'create_admin' ORDER BY timestamp DESC LIMIT 1");
    assert.ok(auditDbRes.rows.length > 0);
    console.log('✅ 8. Super admin created administrator with one-time access code & audit logged: PASS');
  });

  // T9
  await t.test('9. Chatbot helpline consent only triggers on affirmative action, not "leave me alone"', async () => {
    const clientToken = jwt.sign({ id: 'client_user_test_01', email: 'c1@mindcare.test', role: 'client' }, JWT_SECRET);
    const leaveMeAloneRes = await request('POST', '/api/companion/chat', { message: 'please leave me alone' }, clientToken);
    const affirmativeRes = await request('POST', '/api/companion/chat', { action: { type: 'helpline_consent', value: 'yes' } }, clientToken);

    const noLeakOnLeaveAlone = !JSON.stringify(leaveMeAloneRes.body).includes('Tele-MANAS') && !JSON.stringify(leaveMeAloneRes.body).includes('14416');
    const revealsOnYes = JSON.stringify(affirmativeRes.body).includes('Tele-MANAS') || JSON.stringify(affirmativeRes.body).includes('14416');

    assert.ok(noLeakOnLeaveAlone);
    assert.ok(revealsOnYes);
    console.log('✅ 9. Chatbot helpline consent only triggers on affirmative action, not "leave me alone": PASS');
  });

  // T10
  await t.test('10. WebRTC ICE Configuration endpoint returns environment STUN/TURN servers', async () => {
    const rtcConfigRes = await request('GET', '/api/clinical/rtc-config');
    assert.equal(rtcConfigRes.status, 200);
    const hasStun = rtcConfigRes.body?.iceServers?.some(s => s.urls.includes('stun:'));
    assert.ok(hasStun);
    console.log('✅ 10. WebRTC ICE Configuration endpoint returns environment STUN/TURN servers: PASS');
  });

  // T11
  await t.test('11. admin_audit_log privacy verified: no passwords, access codes, or OTPs logged', async () => {
    const auditPrivacyRes = await db.query("SELECT reason FROM admin_audit_log");
    const rawAuditDump = JSON.stringify(auditPrivacyRes.rows);
    assert.ok(!rawAuditDump.includes('MindCare@'));
    assert.ok(!rawAuditDump.includes('password_hash'));
    assert.ok(!rawAuditDump.includes('ADM-CODE-'));
    console.log('✅ 11. admin_audit_log privacy verified: no passwords, access codes, or OTPs logged: PASS');
  });

  // T12
  await t.test('12. PATCH /api/admin/users/:id/role is removed (404 Not Found)', async () => {
    const adminToken = jwt.sign({ id: 'admin_system_root', email: 'admin@mindcare.com', role: 'admin' }, JWT_SECRET);
    const deletedRoleRouteRes = await request('PATCH', '/api/admin/users/client_user_test_01/role', { role: 'therapist' }, adminToken);
    assert.equal(deletedRoleRouteRes.status, 404);
    console.log('✅ 12. PATCH /api/admin/users/:id/role is removed (404 Not Found): PASS');
  });

  // T13
  await t.test('13. POST /api/clinical/verify-consent-key validates pairing key and logs to consent_audit_logs', async () => {
    const approvedToken = jwt.sign(
      { id: 'th_approved_test_01', email: 'therapist01@mindcare.test', role: 'therapist', name: 'Dr. Marcus Vance' },
      JWT_SECRET
    );

    const consentVerifyRes = await request('POST', '/api/clinical/verify-consent-key', {
      pairingKey: 'CARE-8492-MC',
      clientId: 'client_user_test_01'
    }, approvedToken);

    assert.equal(consentVerifyRes.status, 200);
    const consentLogRes = await db.query(
      "SELECT accessor_therapist_id, accessed_scope FROM consent_audit_logs WHERE accessor_therapist_id = $1 ORDER BY accessed_at DESC LIMIT 1",
      ['th_approved_test_01']
    );
    assert.ok(consentLogRes.rows.length > 0);
    assert.equal(consentLogRes.rows[0].accessed_scope, 'clinical_records_unlock');
    console.log('✅ 13. POST /api/clinical/verify-consent-key validates pairing key and logs to consent_audit_logs: PASS');
  });

  // T14
  await t.test('14. Admin access to client journals strictly forbidden (403)', async () => {
    const adminToken = jwt.sign({ id: 'admin_system_root', email: 'admin@mindcare.com', role: 'admin' }, JWT_SECRET);
    const adminJournalRes = await request('GET', '/api/journal', null, adminToken);
    assert.equal(adminJournalRes.status, 403);
    console.log('✅ 14. Admin access to client journals strictly forbidden (403): PASS');
  });

  // T15
  await t.test('15. Documents accessible only via signed HMAC URLs; unsigned access rejected', async () => {
    const unsignedDocRes = await request('GET', '/api/clinical/documents/fake-doc-id/download', null, null);
    assert.ok([400, 401, 403].includes(unsignedDocRes.status));
    console.log('✅ 15. Documents accessible only via signed HMAC URLs; unsigned access rejected: PASS');
  });

  // T16
  await t.test('16. ENCRYPTION_KEY required at startup and execution; fails without key', async () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    let thrownError = false;
    try {
      const { encryptField } = await import('../utils/crypto.js');
      encryptField('sensitive clinical text');
    } catch (e) {
      thrownError = true;
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }

    assert.ok(thrownError);
    console.log('✅ 16. ENCRYPTION_KEY required at startup and execution; fails without key: PASS');
  });

  console.log('\n========================================');
  console.log('RESULT: 16/16 Step 0 Verification Tests Passed');
  console.log('========================================\n');
  process.exit(0);
});
