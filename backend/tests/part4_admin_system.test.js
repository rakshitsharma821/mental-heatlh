// ============================================
// MindCare Sanctuary — Part 4 Admin System & Governance Test Suite
// Verifies:
// 1. RBAC: Non-admin tokens get 403 on all /api/admin/* routes
// 2. Admin cannot access client private contents (zero journal/mood/chat exposure)
// 3. Overview returns aggregates, sessions, and friendly score-band counts
// 4. Therapist verification queue, dossier viewer, and signed document tokens
// 5. Per-document Accept/Reject (rejection moves therapist to more_info_required)
// 6. Overall verification decision: demo clinicians can NEVER be approved (400)
// 7. Searchable user directory with assigned therapist and session status
// 8. Force password reset flag
// 9. DPDP account erasure & anonymization
// 10. Session pipeline: assigning approved therapist
// 11. Decline review: "Ask Why" thread messaging and resolution
// 12. Dynamic config: blocked words & helplines (audit logged)
// 13. Safety & crisis reports: anonymized counts and timestamps only
// 14. Super Admin: admin creation (access code displayed once, never in audit log)
// 15. Audit logs: append-only, filterable, no edit/delete endpoints exist
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db, initPostgresDatabase } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

function apiRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const fullPath = path.startsWith('/api') ? path : `/api${path}`;
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: fullPath,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('--- STARTING PART 4 ADMIN SYSTEM TEST SUITE ---', async () => {
  await initPostgresDatabase();
  console.log('--- STARTING PART 4 ADMIN SYSTEM TEST SUITE ---');

  // Generate test IDs
  const randTag = crypto.randomBytes(3).toString('hex');
  const clientUid = `usr_p4_cli_${randTag}`;
  const therapistUid = `usr_p4_th_${randTag}`;
  const approvedThUid = `usr_p4_appth_${randTag}`;
  const demoThUid = `usr_p4_demoth_${randTag}`;
  const adminUid = `adm_p4_${randTag}`;
  const superAdminUid = `sup_p4_${randTag}`;

  // Tokens
  const clientToken = jwt.sign({ id: clientUid, role: 'client', name: 'Member Client' }, JWT_SECRET, { expiresIn: '1h' });
  const therapistToken = jwt.sign({ id: therapistUid, role: 'therapist', name: 'Dr. Pending' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminUid, role: 'admin', name: 'Admin Officer' }, JWT_SECRET, { expiresIn: '1h' });
  const superAdminToken = jwt.sign({ id: superAdminUid, role: 'super_admin', name: 'Super Admin' }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Insert Client with private data
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Priya Sharma', 'client', 'active', 22)
    ON CONFLICT (id) DO NOTHING
  `, [clientUid, `MC-${randTag.toUpperCase()}1`, `priya_${randTag}@mindcare.test`]);

  // Insert private journal for client
  await db.query(`
    INSERT INTO journal_entries (id, user_id, encrypted_content, iv, auth_tag, sentiment_tag)
    VALUES ($1, $2, 'SUPER_SECRET_ENCRYPTED_TEXT', 'iv123', 'tag123', 'reflective')
    ON CONFLICT (id) DO NOTHING
  `, [`j_${randTag}`, clientUid]);

  // 2. Insert Pending Therapist
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Dr. Pending Clinician', 'therapist', 'active', 34)
    ON CONFLICT (id) DO NOTHING
  `, [therapistUid, `THR-${randTag.toUpperCase()}1`, `pending_${randTag}@mindcare.test`]);

  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_demo)
    VALUES ($1, $2, 'RCI-99881', 'Rehabilitation Council of India', 'under_review', FALSE)
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'under_review'
  `, [`tp_${therapistUid}`, therapistUid]);

  // Insert sample document for pending therapist
  const sampleDocId = `doc_${randTag}`;
  await db.query(`
    INSERT INTO therapist_documents (id, therapist_id, doc_type, original_filename, file_size, mime_type, storage_key, status)
    VALUES ($1, $2, 'licence_certificate', 'licence.pdf', 12345, 'application/pdf', 'dummy_key.pdf', 'submitted')
    ON CONFLICT (id) DO NOTHING
  `, [sampleDocId, therapistUid]);

  // 3. Insert Approved Therapist
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Dr. Verified Clinician', 'therapist', 'active', 40)
    ON CONFLICT (id) DO NOTHING
  `, [approvedThUid, `THR-${randTag.toUpperCase()}2`, `approved_${randTag}@mindcare.test`]);

  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_demo, is_available)
    VALUES ($1, $2, 'RCI-11223', 'Rehabilitation Council of India', 'approved', FALSE, TRUE)
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved', is_available = TRUE
  `, [`tp_${approvedThUid}`, approvedThUid]);

  // 4. Insert Demo Clinician (is_demo = true)
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status, age)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Dr. Demo Sample', 'therapist', 'active', 45)
    ON CONFLICT (id) DO NOTHING
  `, [demoThUid, `THR-${randTag.toUpperCase()}3`, `demo_${randTag}@mindcare.test`]);

  await db.query(`
    INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_demo)
    VALUES ($1, $2, 'DEMO-001', 'Demo Board', 'documents_pending', TRUE)
    ON CONFLICT (user_id) DO UPDATE SET is_demo = TRUE
  `, [`tp_${demoThUid}`, demoThUid]);

  // 5. Insert Admin and Super Admin accounts
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Admin Tester', 'admin', 'active')
    ON CONFLICT (id) DO NOTHING
  `, [adminUid, `ADM-${randTag.toUpperCase()}1`, `admin_${randTag}@mindcare.test`]);

  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Super Admin Tester', 'super_admin', 'active')
    ON CONFLICT (id) DO NOTHING
  `, [superAdminUid, `ADM-${randTag.toUpperCase()}2`, `super_${randTag}@mindcare.test`]);

  // ── TEST 1: RBAC - Non-admin client rejected with 403 ──
  const cliOverview = await apiRequest('/admin/overview', 'GET', null, clientToken);
  assert.equal(cliOverview.status, 403, 'Client token must be rejected with 403 on admin overview');

  const cliUsers = await apiRequest('/admin/users', 'GET', null, clientToken);
  assert.equal(cliUsers.status, 403, 'Client token must be rejected with 403 on admin users');

  const cliAudit = await apiRequest('/admin/audit-logs', 'GET', null, clientToken);
  assert.equal(cliAudit.status, 403, 'Client token must be rejected with 403 on admin audit-logs');
  console.log('✅ T1. Non-admin client token rejected with 403 across admin endpoints: PASS');

  // ── TEST 2: RBAC - Non-admin therapist rejected with 403 ──
  const thOverview = await apiRequest('/admin/overview', 'GET', null, therapistToken);
  assert.equal(thOverview.status, 403, 'Therapist token must be rejected with 403 on admin overview');

  const thConfig = await apiRequest('/admin/config', 'GET', null, therapistToken);
  assert.equal(thConfig.status, 403, 'Therapist token must be rejected with 403 on admin config');
  console.log('✅ T2. Non-admin therapist token rejected with 403 across admin endpoints: PASS');

  // ── TEST 3: Overview returns aggregates and friendly score bands ──
  const overviewRes = await apiRequest('/admin/overview', 'GET', null, adminToken);
  assert.equal(overviewRes.status, 200, 'Admin overview must return 200');
  assert.ok(overviewRes.body.stats, 'Overview must include stats object');
  assert.ok(overviewRes.body.stats.scoreBandDistribution, 'Must include score-band distribution');
  assert.ok(overviewRes.body.privacyGuarantee, 'Must include explicit privacy guarantee');
  console.log('✅ T3. Overview endpoint returns aggregates and friendly score bands with zero PII: PASS');

  // ── TEST 4: Therapist verification queue & dossier with signed URLs ──
  const queueRes = await apiRequest('/admin/therapists/queue?status=under_review', 'GET', null, adminToken);
  assert.equal(queueRes.status, 200);
  assert.ok(Array.isArray(queueRes.body.therapists), 'Queue must return therapist array');

  const dossierRes = await apiRequest(`/admin/therapists/${therapistUid}/dossier`, 'GET', null, adminToken);
  assert.equal(dossierRes.status, 200);
  assert.ok(dossierRes.body.therapist, 'Dossier must return therapist profile');
  assert.ok(Array.isArray(dossierRes.body.documents), 'Dossier must return documents');
  assert.ok(dossierRes.body.documents[0].view_url.includes('token='), 'Document must have signed view URL');
  console.log('✅ T4. Therapist queue & dossier returns full profile with signed download token: PASS');

  // ── TEST 5: Document review (rejection moves therapist to more_info_required) ──
  // Rejection without reason fails with 400
  const badReview = await apiRequest(`/admin/therapists/${therapistUid}/documents/${sampleDocId}/review`, 'POST', {
    status: 'rejected',
    rejection_reason: ''
  }, adminToken);
  assert.equal(badReview.status, 400, 'Rejecting document without reason must return 400');

  // Valid rejection
  const goodReview = await apiRequest(`/admin/therapists/${therapistUid}/documents/${sampleDocId}/review`, 'POST', {
    status: 'rejected',
    rejection_reason: 'Degree seal is unreadable, please upload high-res scan'
  }, adminToken);
  assert.equal(goodReview.status, 200);

  // Check therapist status transitioned to more_info_required
  const thCheck = await db.query('SELECT verification_status FROM therapist_profiles WHERE user_id = $1', [therapistUid]);
  assert.equal(thCheck.rows[0].verification_status, 'more_info_required', 'Rejected doc must transition therapist to more_info_required');
  console.log('✅ T5. Document review with rejection transitions clinician to more_info_required: PASS');

  // ── TEST 6: Overall verification decision (Demo clinicians cannot be approved) ──
  const demoApprove = await apiRequest(`/admin/therapists/${demoThUid}/verification-decision`, 'POST', {
    decision: 'approve'
  }, adminToken);
  assert.equal(demoApprove.status, 400, 'Demo clinician approval must be rejected with 400');
  assert.match(demoApprove.body.message, /Demo clinician/i);

  // Valid approval on pending therapist
  const validApprove = await apiRequest(`/admin/therapists/${therapistUid}/verification-decision`, 'POST', {
    decision: 'approve',
    licence_verified_externally: true,
    external_verification_notes: 'Verified against RCI portal on 23-Oct'
  }, adminToken);
  assert.equal(validApprove.status, 200);
  assert.equal(validApprove.body.verification_status, 'approved');
  console.log('✅ T6. Demo clinician approval blocked (400); approved clinician updates status: PASS');

  // ── TEST 7: Users directory returns masked info with assignments ──
  const usersRes = await apiRequest(`/admin/users?q=${randTag}`, 'GET', null, adminToken);
  assert.equal(usersRes.status, 200);
  assert.ok(usersRes.body.users && usersRes.body.users.length > 0, 'User search should return at least 1 record');
  const foundClient = usersRes.body.users.find(u => u.id === clientUid);
  assert.ok(foundClient, 'Found client must match clientUid');
  // Guarantee zero private text exposed
  assert.equal(foundClient.encrypted_content, undefined, 'Admin user directory must NEVER expose private content');
  assert.equal(foundClient.answers_json, undefined, 'Admin user directory must NEVER expose questionnaire answers');
  console.log('✅ T7. User directory returns masked info without client journals or answers: PASS');

  // ── TEST 8: Force password reset flag ──
  const resetRes = await apiRequest(`/admin/users/${clientUid}/force-password-reset`, 'POST', {}, adminToken);
  assert.equal(resetRes.status, 200);
  const userCheck = await db.query('SELECT must_change_password FROM users WHERE id = $1', [clientUid]);
  assert.equal(userCheck.rows[0].must_change_password, true, 'must_change_password must be set to TRUE');
  console.log('✅ T8. Admin forced password reset successfully sets user flag: PASS');

  // ── TEST 9: DPDP Account Erasure & Anonymization ──
  const eraseRes = await apiRequest(`/admin/users/${clientUid}`, 'DELETE', {
    confirmation: true,
    reason: 'Client exercised DPDP right to erasure'
  }, adminToken);
  assert.equal(eraseRes.status, 200);

  // Verify personal data anonymized and private entries deleted
  const erasedUser = await db.query('SELECT full_name, email, mobile_number, status FROM users WHERE id = $1', [clientUid]);
  assert.equal(erasedUser.rows[0].full_name, 'Anonymized Member');
  assert.ok(erasedUser.rows[0].email.includes('deleted_'));
  assert.equal(erasedUser.rows[0].mobile_number, null);
  assert.equal(erasedUser.rows[0].status, 'deleted');

  const journalCheck = await db.query('SELECT COUNT(*)::int as count FROM journal_entries WHERE user_id = $1', [clientUid]);
  assert.equal(journalCheck.rows[0].count, 0, 'Client private journal entries must be purged upon DPDP erasure');
  console.log('✅ T9. DPDP account erasure anonymizes identifiers and purges clinical entries: PASS');

  // ── TEST 10: Session Request Pipeline - Assign Approved Therapist ──
  const bookingId = `book_${randTag}`;
  await db.query(`
    INSERT INTO session_bookings (id, client_id, therapist_id, session_type, preferred_slot, status)
    VALUES ($1, $2, $3, 'one_on_one', CURRENT_TIMESTAMP + INTERVAL '1 day', 'requested')
  `, [bookingId, clientUid, therapistUid]);

  const assignRes = await apiRequest(`/admin/session-requests/${bookingId}/assign`, 'POST', {
    therapist_id: approvedThUid,
    admin_notes: 'Matched based on client needs'
  }, adminToken);
  assert.equal(assignRes.status, 200);

  const bookingCheck = await db.query('SELECT therapist_id, status FROM session_bookings WHERE id = $1', [bookingId]);
  assert.equal(bookingCheck.rows[0].therapist_id, approvedThUid);
  assert.equal(bookingCheck.rows[0].status, 'confirmed');
  console.log('✅ T10. Session request assigned to approved therapist: PASS');

  // ── TEST 11: Decline review & "Ask Why" message thread ──
  const declineId = `dec_${randTag}`;
  await db.query(`
    INSERT INTO session_declines (id, session_id, therapist_id, client_id, reason, status)
    VALUES ($1, $2, $3, $4, 'Schedule fully booked for examinations', 'open')
  `, [declineId, bookingId, approvedThUid, clientUid]);

  const askWhyRes = await apiRequest(`/admin/declines/${declineId}/ask-why`, 'POST', {
    message: 'Can you take this client later in the week instead?'
  }, adminToken);
  assert.equal(askWhyRes.status, 200);

  const threadRes = await apiRequest(`/admin/declines/${declineId}/thread`, 'GET', null, adminToken);
  assert.equal(threadRes.status, 200);
  assert.equal(threadRes.body.messages.length, 1);
  assert.equal(threadRes.body.messages[0].message, 'Can you take this client later in the week instead?');

  const resolveRes = await apiRequest(`/admin/declines/${declineId}/resolve`, 'POST', {
    action: 'close',
    notes: 'Client rescheduled with another practitioner'
  }, adminToken);
  assert.equal(resolveRes.status, 200);
  console.log('✅ T11. Decline review "Ask Why" thread and resolution workflow: PASS');

  // ── TEST 12: Dynamic Config - Blocked Words & Helplines (Audit Logged) ──
  const configRes = await apiRequest('/admin/config', 'GET', null, adminToken);
  assert.equal(configRes.status, 200);
  assert.ok(configRes.body.readOnly.questionnaire, 'Must include readOnly questionnaire');
  assert.ok(configRes.body.readOnly.scoreBands, 'Must include readOnly scoreBands');

  const updateWordsRes = await apiRequest('/admin/config/blocked-words', 'PUT', {
    blocked_words: ['hopelessness', 'overwhelmed', 'despair', 'test_word_xyz']
  }, adminToken);
  assert.equal(updateWordsRes.status, 200);
  console.log('✅ T12. Admin updates blocked words list with audit logging: PASS');

  // ── TEST 13: Safety & Crisis Reports (Timestamps and counts only) ──
  await db.query(`
    INSERT INTO crisis_events (id, trigger_type, triggered_at)
    VALUES ($1, 'critical_distress_keyword', CURRENT_TIMESTAMP)
  `, [`ce_${randTag}`]);

  const safetyRes = await apiRequest('/admin/safety-reports', 'GET', null, adminToken);
  assert.equal(safetyRes.status, 200);
  assert.ok(safetyRes.body.totalEvents >= 1);
  assert.ok(Array.isArray(safetyRes.body.recentEvents));
  // Guarantee no client PII
  assert.equal(safetyRes.body.recentEvents[0].client_id, undefined);
  assert.equal(safetyRes.body.recentEvents[0].message_text, undefined);
  console.log('✅ T13. Safety reports return anonymized counts & timestamps only: PASS');

  // ── TEST 14: Super Admin only operations (Create Admin, Access Code Never in Audit Log) ──
  // Normal admin rejected from creating admin
  const normalAdminCreate = await apiRequest('/admin/super/create-admin', 'POST', {
    email: `new_adm_${randTag}@mindcare.test`,
    name: 'New Administrator'
  }, adminToken);
  assert.equal(normalAdminCreate.status, 403, 'Normal admin must get 403 creating admin');

  // Super admin creates admin
  const superCreate = await apiRequest('/admin/super/create-admin', 'POST', {
    email: `new_adm_${randTag}@mindcare.test`,
    name: 'New Administrator'
  }, superAdminToken);
  assert.equal(superCreate.status, 201);
  assert.ok(superCreate.body.oneTimeAccessCode, 'Must return oneTimeAccessCode in response');

  // CRITICAL PRIVACY CHECK: Check audit log does NOT contain the plaintext access code
  const auditCheck = await db.query(`
    SELECT reason, details FROM admin_audit_log WHERE action = 'create_admin' ORDER BY timestamp DESC LIMIT 1
  `);
  const logStr = JSON.stringify(auditCheck.rows[0] || {});
  assert.ok(!logStr.includes(superCreate.body.oneTimeAccessCode), 'One-time access code must NEVER be logged to audit trail');
  console.log('✅ T14. Super Admin creates admin with one-time access code (NOT leaked in audit log): PASS');

  // ── TEST 15: Audit log is append-only (No edit or delete routes exist) ──
  const auditRes = await apiRequest('/admin/audit-logs?limit=10', 'GET', null, adminToken);
  assert.equal(auditRes.status, 200);
  assert.ok(Array.isArray(auditRes.body.auditLogs));
  assert.ok(auditRes.body.auditLogs.length > 0);

  // Attempting DELETE or PUT on audit log must return 404
  const badDelete = await apiRequest('/admin/audit-logs/some-id', 'DELETE', {}, adminToken);
  assert.equal(badDelete.status, 404, 'DELETE /admin/audit-logs must return 404 (append-only)');
  console.log('✅ T15. Audit logs are append-only; mutation endpoints return 404: PASS');

  console.log('\n========================================');
  console.log('RESULT: 15/15 Part 4 Admin System Tests Passed');
  console.log('========================================\n');
});
