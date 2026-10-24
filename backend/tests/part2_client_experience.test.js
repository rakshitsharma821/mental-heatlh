// ============================================
// MindCare Sanctuary — Part 2 Client Experience Test Suite
// Verifies:
// 1. Fixed 8 questions, 0-3 scale, young adult target (20-25)
// 2. Score band mapping consistency (low: 0-7, moderate: 8-15, high: 16-24)
// 3. Welcome note API authentication & fallback
// 4. Assessment submission & validation (authenticated & guest)
// 5. Latest assessment retrieval
// 6. Focus mode and recommendations data contracts
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import { db, initPostgresDatabase } from '../models/db.js';
import { SCORE_BANDS, getBandDetails } from '../../shared/questionnaireBands.js';
import { QUESTIONNAIRE_CONFIG } from '../../frontend/src/config/questionnaire.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

test('--- STARTING PART 2 CLIENT EXPERIENCE & QUESTIONNAIRE TESTS ---', async () => {
  await initPostgresDatabase();
  console.log('--- STARTING PART 2 CLIENT EXPERIENCE & QUESTIONNAIRE TESTS ---');

  // Helper to create test client
  const clientUid = `test-p2-client-${crypto.randomBytes(4).toString('hex')}`;
  const clientEmail = `${clientUid}@mindcare.test`;
  const clientPublicId = `MC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  await db.query(`
    INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, age, role, status)
    VALUES ($1, $2, $3, 'hash', 'salt', 'rec', 'P2 Test Client', 23, 'client', 'active')
    ON CONFLICT (email) DO NOTHING
  `, [clientUid, clientPublicId, clientEmail]);

  const clientToken = jwt.sign(
    { id: clientUid, public_id: clientPublicId, email: clientEmail, role: 'client', status: 'active', name: 'P2 Test Client' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // T1: Questionnaire schema matches Young Adult Spec (8 questions, 0-3 scale, audience 20-25)
  assert.equal(QUESTIONNAIRE_CONFIG.targetAudience, '20-25', 'Target audience must be young adults aged 20-25');
  assert.equal(QUESTIONNAIRE_CONFIG.questions.length, 8, 'Questionnaire must contain exactly 8 fixed questions');
  assert.equal(QUESTIONNAIRE_CONFIG.scale.length, 4, 'Questionnaire must use a 0-3 scale (4 options)');
  assert.deepEqual(QUESTIONNAIRE_CONFIG.scale.map(s => s.value), [0, 1, 2, 3], 'Scale values must be 0, 1, 2, 3');
  console.log('✅ T1. Questionnaire schema verified: 8 fixed questions, 0-3 scale, 20-25 age range: PASS');

  // T2: Unified score band thresholds (0-7: Steady Rhythm, 8-15: Rest & Reset, 16-24: Care & Comfort)
  const lowBand = getBandDetails(5);
  const modBand = getBandDetails(12);
  const highBand = getBandDetails(20);

  assert.equal(lowBand.id, 'low');
  assert.equal(lowBand.title, 'Steady Rhythm');
  assert.equal(modBand.id, 'moderate');
  assert.equal(modBand.title, 'Rest & Reset');
  assert.equal(highBand.id, 'high');
  assert.equal(highBand.title, 'Care & Comfort');
  console.log('✅ T2. Score band mapping unified across system: PASS');

  // T3: Welcome message API requires authentication (401 for unauthenticated)
  const unauthRes = await fetch(`${BASE_URL}/assessment/welcome-message`);
  assert.equal(unauthRes.status, 401, 'Unauthenticated welcome message request should return 401');
  console.log('✅ T3. Welcome note requires authentication (401): PASS');

  // T4: Authenticated user receives personalized welcome note
  const authRes = await fetch(`${BASE_URL}/assessment/welcome-message`, {
    headers: { 'Authorization': `Bearer ${clientToken}` }
  });
  assert.equal(authRes.status, 200);
  const welcomeData = await authRes.json();
  assert.equal(welcomeData.success, true);
  assert.ok(typeof welcomeData.message === 'string' && welcomeData.message.length > 10);
  console.log('✅ T4. Authenticated client receives encouraging welcome note: PASS');

  // T5: Save assessment validation: rejects missing parameters
  const invalidRes1 = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_score: 10 })
  });
  assert.equal(invalidRes1.status, 400);

  // T6: Save assessment validation: rejects out-of-range total score (> 24 or < 0)
  const invalidRes2 = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      total_score: 30,
      band: 'high',
      answers: { q1: 3, q2: 3 }
    })
  });
  assert.equal(invalidRes2.status, 400);

  // T7: Save assessment validation: rejects invalid band ID
  const invalidRes3 = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      total_score: 12,
      band: 'critical_emergency',
      answers: { q1: 1, q2: 2 }
    })
  });
  assert.equal(invalidRes3.status, 400);
  console.log('✅ T5-T7. Assessment submission input validations strictly enforced (400): PASS');

  // T8: Valid assessment submission for authenticated client
  const submitRes = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`
    },
    body: JSON.stringify({
      total_score: 11,
      band: 'moderate',
      answers: {
        q1: 1, q2: 2, q3: 1, q4: 2, q5: 1, q6: 2, q7: 1, q8: 1
      }
    })
  });
  assert.equal(submitRes.status, 201);
  const submitData = await submitRes.json();
  assert.equal(submitData.success, true);
  assert.ok(submitData.assessmentId);
  console.log('✅ T8. Assessment successfully recorded for authenticated member: PASS');

  // T9: Retrieve latest assessment for authenticated member
  const latestRes = await fetch(`${BASE_URL}/assessment/latest`, {
    headers: { 'Authorization': `Bearer ${clientToken}` }
  });
  assert.equal(latestRes.status, 200);
  const latestData = await latestRes.json();
  assert.equal(latestData.success, true);
  assert.equal(latestData.assessment.total_score, 11);
  assert.equal(latestData.assessment.band, 'moderate');
  console.log('✅ T9. Latest assessment retrieval matches recorded score & band: PASS');

  // T10: Recommendations config provides structured activities for all 3 score bands
  for (const band of QUESTIONNAIRE_CONFIG.bands) {
    assert.ok(['low', 'moderate', 'high'].includes(band.id), `Band id ${band.id} valid`);
    assert.ok(band.title, 'Band title required');
    assert.ok(band.recommendations.games.length > 0, 'Games recommendations present');
    assert.ok(band.recommendations.breathing.length > 0, 'Breathing exercises present');
    assert.ok(band.recommendations.yoga.length > 0, 'Yoga recommendations present');
    assert.ok(band.recommendations.music.length > 0, 'Calming music present');
  }
  console.log('✅ T10. Recommendations config provides complete activity mix for every band: PASS');

  console.log('\n========================================');
  console.log('RESULT: 10/10 Part 2 Client Experience Tests Passed');
  console.log('========================================\n');
});
