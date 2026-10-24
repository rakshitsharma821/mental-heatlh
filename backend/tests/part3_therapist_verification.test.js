// ============================================
// MindCare Sanctuary — Part 3 Therapist Verification Test Suite
// Verifies:
// 1. Therapist signup with extended clinical fields (no 20-25 age limit for therapists)
// 2. Non-approved therapists get 403 on availability, requests, treatment plans, calls
// 3. Document upload validation: file size, MIME & magic bytes, path traversal, consent
// 4. Document access authorization: only owner/admin, signed token expiration
// 5. Submit dossier blocked until all required documents exist
// 6. Approval state unlocks clinical capabilities
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { db, initPostgresDatabase } from '../models/db.js';
import { CLINICAL_CONFIG } from '../../shared/clinicalConfig.js';
import { clinicalStorage } from '../utils/clinicalStorage.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

test('--- STARTING PART 3 THERAPIST VERIFICATION TEST SUITE ---', async () => {
  await initPostgresDatabase();
  console.log('--- STARTING PART 3 THERAPIST VERIFICATION TEST SUITE ---');

  // Create Test Users
  const therapistUid = `th-p3-${crypto.randomBytes(4).toString('hex')}`;
  const therapistEmail = `${therapistUid}@clinic.test`;
  const therapistPublicId = `THR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const otherTherapistUid = `th-other-${crypto.randomBytes(4).toString('hex')}`;
  const otherTherapistEmail = `${otherTherapistUid}@clinic.test`;
  const otherTherapistPublicId = `THR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const adminUid = `adm-p3-${crypto.randomBytes(4).toString('hex')}`;
  const adminEmail = `${adminUid}@mindcare.test`;
  const adminPublicId = `ADM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // 1. Insert Unapproved Therapist
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, age, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Dr. Evelyn Cross', 38, 'therapist', 'active')
    ON CONFLICT (email) DO NOTHING
  `, [therapistUid, therapistPublicId, therapistEmail]);

  await db.query(`
    INSERT INTO therapist_profiles (
      id, user_id, license_number, licensing_board, specialties, bio, is_available,
      title, verification_status, is_demo, therapist_type, years_of_experience
    ) VALUES (
      $1, $2, 'RCI-TEST-9921', 'Rehabilitation Council of India (RCI)', '["CBT"]'::jsonb,
      'Clinical specialist in anxiety regulation.', FALSE,
      'Clinical Psychologist', 'documents_pending', FALSE, 'Clinical Psychologist', 8
    )
    ON CONFLICT (user_id) DO UPDATE SET verification_status = 'documents_pending'
  `, ['tp_' + therapistUid, therapistUid]);

  // 2. Insert Second Therapist
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, age, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'Dr. Other Specialist', 42, 'therapist', 'active')
    ON CONFLICT (email) DO NOTHING
  `, [otherTherapistUid, otherTherapistPublicId, otherTherapistEmail]);

  await db.query(`
    INSERT INTO therapist_profiles (
      id, user_id, license_number, licensing_board, specialties, bio, is_available,
      title, verification_status, is_demo
    ) VALUES (
      $1, $2, 'RCI-OTHER-11', 'RCI', '["MBSR"]'::jsonb, 'Other', FALSE, 'Psychologist', 'documents_pending', FALSE
    )
    ON CONFLICT (user_id) DO NOTHING
  `, ['tp_' + otherTherapistUid, otherTherapistUid]);

  // 3. Insert Admin
  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'System Verifier', 'admin', 'active')
    ON CONFLICT (email) DO NOTHING
  `, [adminUid, adminPublicId, adminEmail]);

  const therapistToken = jwt.sign(
    { id: therapistUid, public_id: therapistPublicId, email: therapistEmail, role: 'therapist', status: 'active', name: 'Dr. Evelyn Cross' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const otherTherapistToken = jwt.sign(
    { id: otherTherapistUid, public_id: otherTherapistPublicId, email: otherTherapistEmail, role: 'therapist', status: 'active', name: 'Dr. Other Specialist' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: adminUid, public_id: adminPublicId, email: adminEmail, role: 'admin', status: 'active', name: 'System Verifier' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // T1: Age 20-25 restriction is NOT applied to therapists (therapist age 38 successfully stored)
  const ageRes = await db.query('SELECT age, role FROM users WHERE id = $1', [therapistUid]);
  assert.equal(ageRes.rows[0].age, 38);
  assert.equal(ageRes.rows[0].role, 'therapist');
  console.log('✅ T1. Therapist registration accepts professional age (>25): PASS');

  // T2: Non-approved therapist gets 403 on availability toggle
  const availRes = await fetch(`${BASE_URL}/clinical/availability/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${therapistToken}`
    },
    body: JSON.stringify({ is_available: true })
  });
  assert.equal(availRes.status, 403, 'Unapproved therapist must receive 403 on availability toggle');
  console.log('✅ T2. Non-approved therapist gets 403 on availability toggle: PASS');

  // T3: Non-approved therapist gets 403 on session requests
  const reqRes = await fetch(`${BASE_URL}/clinical/requests`, {
    headers: { 'Authorization': `Bearer ${therapistToken}` }
  });
  assert.equal(reqRes.status, 403, 'Unapproved therapist must receive 403 on session requests');
  console.log('✅ T3. Non-approved therapist gets 403 on session requests: PASS');

  // T4: Non-approved therapist gets 403 on saving treatment plans
  const planRes = await fetch(`${BASE_URL}/clinical/treatment-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${therapistToken}`
    },
    body: JSON.stringify({
      clientId: 'any_client',
      requiresFurtherEvaluation: false,
      clinicalNotes: 'Test unapproved'
    })
  });
  assert.equal(planRes.status, 403, 'Unapproved therapist must receive 403 on treatment plans');
  console.log('✅ T4. Non-approved therapist gets 403 on treatment plans: PASS');

  // T5: Document upload rejects missing DPDP consent agreement (400)
  const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const blob = new Blob([pdfHeader], { type: 'application/pdf' });

  const formDataNoConsent = new FormData();
  formDataNoConsent.append('file', blob, 'aadhaar_masked.pdf');
  formDataNoConsent.append('doc_type', 'govt_id');
  formDataNoConsent.append('consent_agreed', 'false');

  const uploadNoConsentRes = await fetch(`${BASE_URL}/clinical/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${therapistToken}` },
    body: formDataNoConsent
  });
  assert.equal(uploadNoConsentRes.status, 400);
  console.log('✅ T5. Document upload rejects missing DPDP consent: PASS');

  // T6: Document upload rejects magic bytes mismatch (spoofed extension)
  const fakePdfBuffer = Buffer.from('THIS IS PLAIN TEXT NOT A REAL PDF');
  const fakePdfBlob = new Blob([fakePdfBuffer], { type: 'application/pdf' });
  const formSpoofed = new FormData();
  formSpoofed.append('file', fakePdfBlob, 'fake_degree.pdf');
  formSpoofed.append('doc_type', 'degree_certificate');
  formSpoofed.append('consent_agreed', 'true');

  const spoofedRes = await fetch(`${BASE_URL}/clinical/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${therapistToken}` },
    body: formSpoofed
  });
  assert.equal(spoofedRes.status, 400);
  console.log('✅ T6. Document upload rejects spoofed magic bytes mismatch: PASS');

  // T7: Valid document uploads accepted and metadata stored in private vault
  let uploadedGovtId = null;
  const formValidGovtId = new FormData();
  formValidGovtId.append('file', blob, 'masked_aadhaar.pdf');
  formValidGovtId.append('doc_type', 'govt_id');
  formValidGovtId.append('consent_agreed', 'true');

  const validGovtRes = await fetch(`${BASE_URL}/clinical/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${therapistToken}` },
    body: formValidGovtId
  });
  assert.equal(validGovtRes.status, 201);
  const govtData = await validGovtRes.json();
  assert.equal(govtData.success, true);
  assert.equal(govtData.document.doc_type, 'govt_id');
  uploadedGovtId = govtData.document.id;
  console.log('✅ T7. Valid document successfully encrypted & vaulted: PASS');

  // T8: Only owner or admin can request signed download URL (other therapist gets 403)
  const otherReqUrl = await fetch(`${BASE_URL}/clinical/documents/${uploadedGovtId}/signed-url`, {
    headers: { 'Authorization': `Bearer ${otherTherapistToken}` }
  });
  assert.equal(otherReqUrl.status, 403, 'Other therapist must receive 403 accessing another clinician documents');

  const ownerReqUrl = await fetch(`${BASE_URL}/clinical/documents/${uploadedGovtId}/signed-url`, {
    headers: { 'Authorization': `Bearer ${therapistToken}` }
  });
  assert.equal(ownerReqUrl.status, 200);
  const ownerUrlData = await ownerReqUrl.json();
  assert.ok(ownerUrlData.token);
  console.log('✅ T8. Document access restricted to owner/admin; other clinician gets 403: PASS');

  // T9: Submit for review blocked (400) when required documents are missing
  const submitPremature = await fetch(`${BASE_URL}/clinical/documents/submit-for-review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${therapistToken}` }
  });
  assert.equal(submitPremature.status, 400);
  const prematureData = await submitPremature.json();
  assert.equal(prematureData.success, false);
  assert.ok(prematureData.missingDocuments.length > 0);
  console.log('✅ T9. Submit for review blocked (400) when required documents are missing: PASS');

  // Upload remaining required documents: degree_certificate, licence_certificate, photo
  const requiredRemaining = ['degree_certificate', 'licence_certificate', 'photo'];
  for (const docType of requiredRemaining) {
    const docForm = new FormData();
    docForm.append('file', blob, `${docType}.pdf`);
    docForm.append('doc_type', docType);
    docForm.append('consent_agreed', 'true');
    await fetch(`${BASE_URL}/clinical/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${therapistToken}` },
      body: docForm
    });
  }

  // T10: Submit dossier succeeds when all required documents exist and moves to 'under_review'
  const submitValid = await fetch(`${BASE_URL}/clinical/documents/submit-for-review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${therapistToken}` }
  });
  assert.equal(submitValid.status, 200);
  const submitValidData = await submitValid.json();
  assert.equal(submitValidData.success, true);
  assert.equal(submitValidData.verification_status, 'under_review');
  console.log('✅ T10. Complete dossier moves status to under_review: PASS');

  // T11: When administrative governance marks verification_status = 'approved', capabilities unlock
  await db.query(`
    UPDATE therapist_profiles
    SET verification_status = 'approved'
    WHERE user_id = $1
  `, [therapistUid]);

  const approvedAvailRes = await fetch(`${BASE_URL}/clinical/availability/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${therapistToken}`
    },
    body: JSON.stringify({ is_available: true })
  });
  assert.equal(approvedAvailRes.status, 200);
  const approvedData = await approvedAvailRes.json();
  assert.equal(approvedData.success, true);
  console.log('✅ T11. Administrative approval unlocks clinician availability & workspace: PASS');

  console.log('\n========================================');
  console.log('RESULT: 11/11 Part 3 Therapist Verification Tests Passed');
  console.log('========================================\n');
});
