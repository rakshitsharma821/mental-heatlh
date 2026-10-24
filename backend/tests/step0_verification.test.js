// ============================================
// MindCare Test Suite — Step 0 Verification & Hardening
// Verifies all 10 Items from Section A and Section B
// ============================================

import http from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
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

async function runStep0Tests() {
  console.log('--- STARTING STEP 0 VERIFICATION & HARDENING TESTS ---');
  let passed = 0;
  let total = 16;

  try {
    // T1: Public client register forces 'client' even if role: 'admin' is provided
    const rand = Math.floor(1000 + Math.random() * 9000);
    const regRes = await request('POST', '/api/auth/register', {
      email: `tamper_role_${rand}@mindcare.test`,
      password: 'Password123!',
      name: 'Role Tamper Test',
      role: 'super_admin', // Attempt escalation
      mobile_number: `+919811${rand}0`,
      age: 22,
      gender: 'Other',
      address: 'Step0 Test Ave'
    });

    const isClient = regRes.status === 201 && regRes.body.user.role === 'client';
    const hasPublicId = regRes.body.user.public_id?.startsWith('MC-');
    if (isClient && hasPublicId) {
      console.log('✅ 1. Public register strictly ignores injected role and forces "client": PASS');
      passed++;
    } else {
      console.error('❌ 1. FAIL:', regRes.body);
    }

    // T2: Seeded demo clinician Dr. Sarah Vance is is_demo: true and not approved
    const demoClinicianRes = await db.query("SELECT is_demo, verification_status FROM therapist_profiles WHERE user_id = 'th_sarah_vance'");
    const demoRow = demoClinicianRes.rows[0];
    if (demoRow && demoRow.is_demo === true && demoRow.verification_status !== 'approved') {
      console.log('✅ 2. Seeded clinician (Dr. Sarah Vance) flagged is_demo=true and not approved: PASS');
      passed++;
    } else {
      console.error('❌ 2. FAIL: Demo clinician status:', demoRow);
    }

    // T3: Non-approved therapist gets 403 on treatment plan & availability
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

    if (unapprovedPlanRes.status === 403) {
      console.log('✅ 3. Non-approved therapist rejected (403) from saving treatment plans: PASS');
      passed++;
    } else {
      console.error('❌ 3. FAIL: Expected 403 but got', unapprovedPlanRes.status);
    }

    // T4: Suspended user rejected on authenticated request (403)
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('client_suspended_01', 'suspended@mindcare.test', 'h', 's', 'r', 'Suspended Member', 'client', 'suspended')
      ON CONFLICT (id) DO UPDATE SET status = 'suspended';
    `);
    const suspendedToken = jwt.sign({ id: 'client_suspended_01', email: 'suspended@mindcare.test', role: 'client' }, JWT_SECRET);
    const suspendedReq = await request('GET', '/api/clinical/treatment-plan/client_suspended_01', null, suspendedToken);
    if (suspendedReq.status === 403) {
      console.log('✅ 4. Suspended user blocked on authenticated request (403): PASS');
      passed++;
    } else {
      console.error('❌ 4. FAIL: Expected 403 but got', suspendedReq.status);
    }

    // T5: Approved therapist saves treatment plan with encrypted notes & access log recorded
    const approvedToken = jwt.sign(
      { id: 'th_approved_test_01', email: 'therapist01@mindcare.test', role: 'therapist', name: 'Dr. Marcus Vance' },
      JWT_SECRET
    );

    const testSecretNote = 'Confidential diagnostic reflection: patient exhibits somatic stress spikes.';
    const savePlanRes = await request('POST', '/api/clinical/treatment-plan', {
      clientId: 'client_user_test_01',
      clinicalNotes: testSecretNote,
      evaluationSummary: 'Summary text',
      collaborativeTherapies: ['CBT']
    }, approvedToken);

    // Verify DB stored encrypted text
    const planDbRes = await db.query('SELECT clinical_notes FROM clinical_therapy_plans WHERE client_id = $1 ORDER BY updated_at DESC LIMIT 1', ['client_user_test_01']);
    const rawStoredNotes = planDbRes.rows[0]?.clinical_notes || '';
    const isEncrypted = rawStoredNotes.includes('ciphertext') && !rawStoredNotes.includes(testSecretNote);

    // Verify access log exists
    const accessLogRes = await db.query('SELECT action, accessor_id FROM clinical_plan_access_logs WHERE accessor_id = $1 ORDER BY accessed_at DESC LIMIT 1', ['th_approved_test_01']);
    const hasLog = accessLogRes.rows.length > 0 && accessLogRes.rows[0].action === 'create_or_update';

    if (savePlanRes.status === 201 && isEncrypted && hasLog) {
      console.log('✅ 5. Clinical treatment notes encrypted at rest & access log recorded: PASS');
      passed++;
    } else {
      console.error('❌ 5. FAIL: Plan save:', savePlanRes.status, 'IsEncrypted:', isEncrypted, 'HasLog:', hasLog);
    }

    // T6: Client can view own treatment plan and view is logged; other client gets 403
    const clientToken = jwt.sign({ id: 'client_user_test_01', email: 'c1@mindcare.test', role: 'client' }, JWT_SECRET);
    const otherClientToken = jwt.sign({ id: 'client_user_test_02', email: 'c2@mindcare.test', role: 'client' }, JWT_SECRET);

    const clientViewOwn = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, clientToken);
    const clientViewOther = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, otherClientToken);

    if (clientViewOwn.status === 200 && clientViewOwn.body.plan?.clinical_notes === testSecretNote && clientViewOther.status === 403) {
      console.log('✅ 6. Client reads decrypted own plan; other client forbidden (403): PASS');
      passed++;
    } else {
      console.error('❌ 6. FAIL: Own view status:', clientViewOwn.status, 'Other view status:', clientViewOther.status);
    }

    // T7: Persistent clinical chat message encrypted at rest; admin forbidden (403)
    const sendMsgRes = await request('POST', '/api/clinical/messages', {
      roomId: 'room_step0_test_99',
      recipientId: 'th_approved_test_01',
      text: 'Hello doctor, feeling uneasy tonight.'
    }, clientToken);

    const msgDbRes = await db.query('SELECT encrypted_content, iv, auth_tag FROM clinical_messages WHERE room_id = $1', ['room_step0_test_99']);
    const storedMsg = msgDbRes.rows[0];
    const decryptedMsg = decryptField(storedMsg.encrypted_content, storedMsg.iv, storedMsg.auth_tag);

    const adminToken = jwt.sign({ id: 'admin_system_root', email: 'admin@mindcare.com', role: 'admin' }, JWT_SECRET);
    const adminMsgAccess = await request('GET', '/api/clinical/messages/room_step0_test_99', null, adminToken);

    if (sendMsgRes.status === 201 && decryptedMsg === 'Hello doctor, feeling uneasy tonight.' && adminMsgAccess.status === 403) {
      console.log('✅ 7. Clinical chat encrypted at rest; administrators forbidden from reading (403): PASS');
      passed++;
    } else {
      console.error('❌ 7. FAIL: send status:', sendMsgRes.status, 'Admin status:', adminMsgAccess.status);
    }

    // T8: Super admin creates administrator with one-time code & logs to admin_audit_log
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

    const auditDbRes = await db.query("SELECT action, target_type FROM admin_audit_log WHERE action = 'create_admin' ORDER BY timestamp DESC LIMIT 1");

    if (createAdminRes.status === 201 && createAdminRes.body.oneTimeAccessCode && auditDbRes.rows.length > 0) {
      console.log('✅ 8. Super admin created administrator with one-time access code & audit logged: PASS');
      passed++;
    } else {
      console.error('❌ 8. FAIL:', createAdminRes.status, createAdminRes.body);
    }

    // T9: Chatbot helpline consent: "please leave me alone" does NOT reveal helpline
    const leaveMeAloneRes = await request('POST', '/api/companion/chat', { message: 'please leave me alone' }, clientToken);
    const affirmativeRes = await request('POST', '/api/companion/chat', { action: { type: 'helpline_consent', value: 'yes' } }, clientToken);

    const noLeakOnLeaveAlone = !JSON.stringify(leaveMeAloneRes.body).includes('Tele-MANAS') && !JSON.stringify(leaveMeAloneRes.body).includes('14416');
    const revealsOnYes = JSON.stringify(affirmativeRes.body).includes('Tele-MANAS') || JSON.stringify(affirmativeRes.body).includes('14416');

    if (noLeakOnLeaveAlone && revealsOnYes) {
      console.log('✅ 9. Chatbot helpline consent only triggers on affirmative action, not "leave me alone": PASS');
      passed++;
    } else {
      console.error('❌ 9. FAIL: noLeak:', noLeakOnLeaveAlone, 'revealsOnYes:', revealsOnYes);
    }

    // T10: WebRTC STUN/TURN configuration configurable from env
    const rtcConfigRes = await request('GET', '/api/clinical/rtc-config');
    const hasStun = rtcConfigRes.body?.iceServers?.some(s => s.urls.includes('stun:'));

    if (rtcConfigRes.status === 200 && hasStun) {
      console.log('✅ 10. WebRTC ICE Configuration endpoint returns environment STUN/TURN servers: PASS');
      passed++;
    } else {
      console.error('❌ 10. FAIL: RTC config:', rtcConfigRes.body);
    }

    // T11: admin_audit_log privacy: strictly no passwords, access codes, OTPs, or document contents
    const auditPrivacyRes = await db.query("SELECT reason FROM admin_audit_log");
    const rawAuditDump = JSON.stringify(auditPrivacyRes.rows);
    const hasNoPasswords = !rawAuditDump.includes('MindCare@') && !rawAuditDump.includes('password_hash') && !rawAuditDump.includes('ADM-CODE-');
    if (hasNoPasswords) {
      console.log('✅ 11. admin_audit_log privacy verified: no passwords, access codes, or OTPs logged: PASS');
      passed++;
    } else {
      console.error('❌ 11. FAIL: Sensitive data detected in admin_audit_log');
    }

    // T12: PATCH /api/admin/users/:id/role is completely deleted and returns 404
    const deletedRoleRouteRes = await request('PATCH', '/api/admin/users/client_user_test_01/role', { role: 'therapist' }, adminToken);
    if (deletedRoleRouteRes.status === 404) {
      console.log('✅ 12. PATCH /api/admin/users/:id/role is removed (404 Not Found): PASS');
      passed++;
    } else {
      console.error('❌ 12. FAIL: Expected 404 but got', deletedRoleRouteRes.status);
    }

    // T13: Clinical consent key verification & audit logging
    const consentVerifyRes = await request('POST', '/api/clinical/verify-consent-key', {
      pairingKey: 'CARE-8492-MC',
      clientId: 'client_user_test_01'
    }, approvedToken);

    const consentLogRes = await db.query(
      "SELECT accessor_therapist_id, accessed_scope FROM consent_audit_logs WHERE accessor_therapist_id = $1 ORDER BY accessed_at DESC LIMIT 1",
      ['th_approved_test_01']
    );

    if (consentVerifyRes.status === 200 && consentLogRes.rows.length > 0 && consentLogRes.rows[0].accessed_scope === 'clinical_records_unlock') {
      console.log('✅ 13. POST /api/clinical/verify-consent-key validates pairing key and logs to consent_audit_logs: PASS');
      passed++;
    } else {
      console.error('❌ 13. FAIL: Consent verification:', consentVerifyRes.status, 'Audit log count:', consentLogRes.rows.length);
    }

    // T14: Administrator forbidden from reading member journals (403 Forbidden)
    const adminJournalRes = await request('GET', '/api/journal', null, adminToken);
    if (adminJournalRes.status === 403) {
      console.log('✅ 14. Admin access to client journals strictly forbidden (403): PASS');
      passed++;
    } else {
      console.error('❌ 14. FAIL: Admin journal access returned', adminJournalRes.status);
    }

    // T15: Vault documents require signed HMAC token; unsigned request rejected (400 or 401)
    const unsignedDocRes = await request('GET', '/api/clinical/documents/fake-doc-id/download', null, null);
    if ([400, 401, 403].includes(unsignedDocRes.status)) {
      console.log('✅ 15. Documents accessible only via signed HMAC URLs; unsigned access rejected: PASS');
      passed++;
    } else {
      console.error('❌ 15. FAIL: Unsigned document request returned', unsignedDocRes.status);
    }

    // T16: ENCRYPTION_KEY required: verifying encryptField fails safely without key
    const originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    let thrownError = false;
    try {
      const { encryptField } = await import('../utils/crypto.js');
      // When key is missing, encryptField or decryptField should fail
      encryptField('sensitive clinical text');
    } catch (e) {
      thrownError = true;
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }

    if (thrownError) {
      console.log('✅ 16. ENCRYPTION_KEY required at startup and execution; fails without key: PASS');
      passed++;
    } else {
      console.error('❌ 16. FAIL: Missing ENCRYPTION_KEY did not fail safely');
    }

  } catch (err) {
    console.error('Step 0 test execution error:', err);
  }

  console.log(`\n========================================`);
  console.log(`RESULT: ${passed}/${total} Step 0 Verification Tests Passed`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStep0Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
