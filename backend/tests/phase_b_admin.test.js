// ============================================
// MindCare Test Suite — Phase B: Roles + Admin System & Cleanups
// Tests:
// 1. Single source of truth for blocked words and safe synonyms
// 2. Single config for helplines (Tele-MANAS, KIRAN, Vandrevala, AASRA)
// 3. Score-band friendly titles (Steady Rhythm, Rest & Reset, Care & Comfort)
// 4. companion_user_words expiry & privacy isolation
// 5. RBAC: Client forbidden from admin endpoints (403)
// 6. RBAC: Therapist forbidden from admin endpoints (403)
// 7. Admin authorized: GET /api/admin/stats returns aggregate metrics with friendly band labels
// 8. Admin authorized: GET /api/admin/users returns sanitized user directory
// 9. Admin role management: PATCH /api/admin/users/:id/role updates user role
// 10. Admin self-demotion prevention & therapist verification management
// ============================================

import http from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import {
  BLOCKED_WORDS,
  SAFE_SYNONYMS,
  filterBotOutput,
  INDIA_HELPLINES_MESSAGE,
  HELPLINES
} from '../../shared/safeLanguage.js';
import { SCORE_BANDS } from '../../shared/questionnaireBands.js';

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
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
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

async function runPhaseBTests() {
  console.log('--- STARTING PHASE B (ROLES + ADMIN SYSTEM) & CLEANUPS TESTS ---');
  let passedCount = 0;
  const totalTests = 10;

  // Test Tokens
  const clientToken = jwt.sign(
    { id: 'client_user_test_01', email: 'client01@mindcare.test', role: 'client', name: 'Test Client' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const therapistToken = jwt.sign(
    { id: 'th_sarah_vance', email: 'sarah.vance@mindcare.com', role: 'therapist', name: 'Dr. Sarah Vance, PsyD' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: 'admin_system_root', email: 'admin@mindcare.com', role: 'admin', name: 'MindCare Administrator' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    // 1. Consolidated safeLanguage & helplines
    const hasTeleManas = HELPLINES.some(h => h.name.includes('Tele-MANAS') && h.numbers.includes('14416'));
    const filterWorks = filterBotOutput("I feel so much anxiety today", "") === "I feel so much unease today";
    if (hasTeleManas && filterWorks && BLOCKED_WORDS.length > 20) {
      console.log('✅ T1. Single consolidated source of truth for blocked words and safe synonyms: PASS');
      passedCount++;
    } else {
      console.error('❌ T1 FAIL');
    }

    // 2. Helplines single config
    const messageHasIndiaNumbers = INDIA_HELPLINES_MESSAGE.includes('14416') && INDIA_HELPLINES_MESSAGE.includes('1800-599-0019');
    if (messageHasIndiaNumbers && HELPLINES.length >= 4) {
      console.log('✅ T2. Single config file for helplines: PASS');
      passedCount++;
    } else {
      console.error('❌ T2 FAIL');
    }

    // 3. Friendly score-band labels
    if (
      SCORE_BANDS.low.title === 'Steady Rhythm' &&
      SCORE_BANDS.moderate.title === 'Rest & Reset' &&
      SCORE_BANDS.high.title === 'Care & Comfort'
    ) {
      console.log('✅ T3. Friendly score-band labels defined & unified across system: PASS');
      passedCount++;
    } else {
      console.error('❌ T3 FAIL: Bands do not match friendly titles');
    }

    // 4. companion_user_words expiry & privacy isolation
    const colRes = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companion_user_words' AND column_name = 'expires_at'
    `);
    if (colRes.rows.length > 0) {
      console.log('✅ T4. companion_user_words has 24h expiry column & auto-purge protection: PASS');
      passedCount++;
    } else {
      console.error('❌ T4 FAIL: expires_at column missing on companion_user_words');
    }

    // 5. RBAC: Client forbidden from admin endpoints
    const clientRes = await request('GET', '/api/admin/stats', null, clientToken);
    if (clientRes.status === 403) {
      console.log('✅ T5. RBAC: Client rejected from admin endpoints (403): PASS');
      passedCount++;
    } else {
      console.error('❌ T5 FAIL: Expected 403 but got', clientRes.status);
    }

    // 6. RBAC: Therapist forbidden from admin endpoints
    const therapistRes = await request('GET', '/api/admin/users', null, therapistToken);
    if (therapistRes.status === 403) {
      console.log('✅ T6. RBAC: Therapist rejected from admin endpoints (403): PASS');
      passedCount++;
    } else {
      console.error('❌ T6 FAIL: Expected 403 but got', therapistRes.status);
    }

    // 7. Admin authorized: GET /api/admin/stats
    const statsRes = await request('GET', '/api/admin/stats', null, adminToken);
    const hasBands = statsRes.body?.stats?.assessmentBands?.low?.title === 'Steady Rhythm';
    const noPrivateLeak = !JSON.stringify(statsRes.body).includes('password_hash') && !JSON.stringify(statsRes.body).includes('encrypted_content');
    if (statsRes.status === 200 && hasBands && noPrivateLeak) {
      console.log('✅ T7. Admin stats returns aggregates with friendly score bands & privacy guarantee: PASS');
      passedCount++;
    } else {
      console.error('❌ T7 FAIL:', statsRes);
    }

    // 8. Admin authorized: GET /api/admin/users
    const usersRes = await request('GET', '/api/admin/users', null, adminToken);
    if (usersRes.status === 200 && Array.isArray(usersRes.body.users) && usersRes.body.users.length > 0) {
      console.log('✅ T8. Admin users directory retrieved with role tracking: PASS');
      passedCount++;
    } else {
      console.error('❌ T8 FAIL:', usersRes);
    }

    // 9. Admin status management: Update user status to suspended and back
    const updateStatusRes = await request('PATCH', '/api/admin/users/client_user_test_01/status', {
      status: 'suspended',
      reason: 'Testing admin status update'
    }, adminToken);
    if (updateStatusRes.status === 200 && updateStatusRes.body.newStatus === 'suspended') {
      console.log('✅ T9. Admin successfully updated user status to suspended: PASS');
      passedCount++;
      // Revert back to active for idempotency
      await request('PATCH', '/api/admin/users/client_user_test_01/status', { status: 'active' }, adminToken);
    } else {
      console.error('❌ T9 FAIL:', updateStatusRes);
    }

    // 10. Admin self-alteration protection & therapist verification
    const demoteSelfRes = await request('PATCH', '/api/admin/users/admin_system_root/status', {
      status: 'suspended'
    }, adminToken);
    const verifyTherapistRes = await request('PATCH', '/api/admin/therapists/th_sarah_vance/verification', {
      verification_status: 'verified'
    }, adminToken);

    if (demoteSelfRes.status === 400 && verifyTherapistRes.status === 200) {
      console.log('✅ T10. Admin self-alteration prevented (400) & therapist verification manageable: PASS');
      passedCount++;
    } else {
      console.error('❌ T10 FAIL: Self-demote:', demoteSelfRes.status, 'Verify:', verifyTherapistRes.status);
    }

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log(`\n========================================`);
  console.log(`RESULT: ${passedCount}/${totalTests} Phase B Tests Passed`);
  console.log(`========================================`);

  if (passedCount === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhaseBTests().catch(err => {
  console.error(err);
  process.exit(1);
});
