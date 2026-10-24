// ============================================
// MindCare Test Suite — Task 6: Professional Connect & Role-Based Clinical Authorization
// Tests:
// 1. STUN/TURN RTC configuration endpoint
// 2. Therapist availability check & AI companion fallback logic
// 3. RBAC: Client forbidden from creating treatment plans (403)
// 4. RBAC: Client forbidden from marking further evaluation (403)
// 5. Therapist authorized to save treatment plans & collaborative therapies
// 6. Therapist authorized to mark further clinical evaluation
// 7. Client authorized to read own treatment plan
// 8. Client forbidden from reading other client's treatment plan (403)
// 9. Availability toggle authorization (Therapist allowed, Client forbidden)
// 10. WebRTC Socket.io signaling connection and room join
// ============================================

import http from 'http';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import { db } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';

// Helper to make test HTTP requests
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

async function runTask6Tests() {
  console.log('--- STARTING TASK 6 PROFESSIONAL CONNECT & CLINICAL RBAC TESTS ---');
  let passedCount = 0;
  let totalTests = 10;

  // Ensure test users exist in DB for foreign key constraints
  try {
    await db.query(`
      INSERT INTO users (id, email, password_hash, salt, recovery_key_hash, full_name, role)
      VALUES 
        ('client_user_test_01', 'client01@mindcare.test', 'hash1', 'salt1', 'rec1', 'Test Client 01', 'client'),
        ('client_user_test_02', 'client02@mindcare.test', 'hash2', 'salt2', 'rec2', 'Test Client 02', 'client'),
        ('th_approved_test_01', 'therapist01@mindcare.test', 'hash3', 'salt3', 'rec3', 'Dr. Marcus Vance, PsyD', 'therapist')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO therapist_profiles (id, user_id, license_number, licensing_board, verification_status, is_available)
      VALUES ('tp_approved_test_01', 'th_approved_test_01', 'Lic #PSY-99881', 'State Psychology Board', 'approved', TRUE)
      ON CONFLICT (user_id) DO UPDATE SET verification_status = 'approved', is_available = TRUE;
    `);
  } catch (seedErr) {
    console.warn('Seeding test users warning:', seedErr.message);
  }

  // Create test tokens
  const clientToken = jwt.sign(
    { id: 'client_user_test_01', email: 'client01@mindcare.test', role: 'client', name: 'Test Client' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const anotherClientToken = jwt.sign(
    { id: 'client_user_test_02', email: 'client02@mindcare.test', role: 'client', name: 'Other Client' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const therapistToken = jwt.sign(
    { id: 'th_approved_test_01', email: 'therapist01@mindcare.test', role: 'therapist', name: 'Dr. Marcus Vance, PsyD' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    // 1. RTC Config
    const rtcRes = await request('GET', '/api/clinical/rtc-config');
    if (rtcRes.status === 200 && rtcRes.body.iceServers && rtcRes.body.iceServers.length > 0) {
      console.log('✅ T1. RTC ICE Configuration endpoint returns valid STUN/TURN servers: PASS');
      passedCount++;
    } else {
      console.error('❌ T1 FAIL:', rtcRes);
    }

    // 2. Availability Check
    const availRes = await request('GET', '/api/clinical/availability');
    if (availRes.status === 200 && typeof availRes.body.isAnyAvailable === 'boolean' && typeof availRes.body.fallbackToAi === 'boolean') {
      console.log('✅ T2. Professional availability check returns status & AI companion fallback: PASS');
      passedCount++;
    } else {
      console.error('❌ T2 FAIL:', availRes);
    }

    // 3. RBAC: Client cannot create treatment plan
    const clientPlanRes = await request('POST', '/api/clinical/treatment-plan', {
      clientId: 'client_user_test_01',
      clinicalNotes: 'Self-diagnosed anxiety'
    }, clientToken);
    if (clientPlanRes.status === 403) {
      console.log('✅ T3. RBAC: Client forbidden from creating treatment plan (403): PASS');
      passedCount++;
    } else {
      console.error('❌ T3 FAIL: Expected 403 but got', clientPlanRes.status);
    }

    // 4. RBAC: Client cannot mark further evaluation
    const clientEvalRes = await request('PATCH', '/api/clinical/evaluation/client_user_test_01', {
      requiresFurtherEvaluation: true
    }, clientToken);
    if (clientEvalRes.status === 403) {
      console.log('✅ T4. RBAC: Client forbidden from marking further clinical evaluation (403): PASS');
      passedCount++;
    } else {
      console.error('❌ T4 FAIL: Expected 403 but got', clientEvalRes.status);
    }

    // 5. Therapist can save treatment plan
    const therapistPlanRes = await request('POST', '/api/clinical/treatment-plan', {
      clientId: 'client_user_test_01',
      requiresFurtherEvaluation: true,
      clinicalNotes: 'Initial intake completed. Recommending blended CBT & somatic mindfulness pacing.',
      evaluationSummary: 'Moderate stress elevation with high self-reflection capacity.',
      collaborativeTherapies: ['Cognitive Behavioral Therapy (CBT)', 'Somatic Grounding Protocol', 'Sleep Hygiene Coaching'],
      goals: ['Down-regulate autonomic nervous system', 'Reduce weekly tension spikes']
    }, therapistToken);
    if (therapistPlanRes.status === 201 && therapistPlanRes.body.success) {
      console.log('✅ T5. Therapist authorized to save treatment plan with collaborative therapies: PASS');
      passedCount++;
    } else {
      console.error('❌ T5 FAIL:', therapistPlanRes);
    }

    // 6. Therapist can mark further evaluation
    const therapistEvalRes = await request('PATCH', '/api/clinical/evaluation/client_user_test_01', {
      requiresFurtherEvaluation: true,
      clinicalNotes: 'Further diagnostic assessment scheduled with psychiatrist.'
    }, therapistToken);
    if (therapistEvalRes.status === 200 && therapistEvalRes.body.plan?.requires_further_evaluation === true) {
      console.log('✅ T6. Therapist authorized to update evaluation status and notes: PASS');
      passedCount++;
    } else {
      console.error('❌ T6 FAIL:', therapistEvalRes);
    }

    // 7. Client can fetch own treatment plan
    const clientGetOwn = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, clientToken);
    if (clientGetOwn.status === 200 && clientGetOwn.body.hasPlan === true) {
      console.log('✅ T7. Client can view their own clinical treatment plan: PASS');
      passedCount++;
    } else {
      console.error('❌ T7 FAIL:', clientGetOwn);
    }

    // 8. Client denied viewing another client's plan
    const clientGetOther = await request('GET', '/api/clinical/treatment-plan/client_user_test_01', null, anotherClientToken);
    if (clientGetOther.status === 403) {
      console.log('✅ T8. Client forbidden from viewing another member’s treatment plan (403): PASS');
      passedCount++;
    } else {
      console.error('❌ T8 FAIL: Expected 403 but got', clientGetOther.status);
    }

    // 9. Availability toggle authorization
    const clientToggle = await request('POST', '/api/clinical/availability/toggle', { is_available: true }, clientToken);
    const therapistToggle = await request('POST', '/api/clinical/availability/toggle', { is_available: false }, therapistToken);
    if (clientToggle.status === 403 && therapistToggle.status === 200) {
      console.log('✅ T9. Availability toggle: Therapist permitted, Client rejected (403): PASS');
      passedCount++;
      // Restore availability back to true
      await request('POST', '/api/clinical/availability/toggle', { is_available: true }, therapistToken);
    } else {
      console.error('❌ T9 FAIL: Client toggle status:', clientToggle.status, 'Therapist toggle status:', therapistToggle.status);
    }

    // 10. WebRTC Socket.io signaling test
    await new Promise((resolve) => {
      const socket = ClientIO('http://localhost:5000', {
        transports: ['websocket'],
        reconnection: false
      });

      socket.on('connect', () => {
        socket.emit('join-room', {
          roomId: 'test_clinical_room_101',
          userId: 'client_user_test_01',
          userName: 'Test Client',
          role: 'client'
        });
      });

      socket.on('room-ready', (data) => {
        if (data.roomId === 'test_clinical_room_101') {
          console.log('✅ T10. WebRTC Socket.io signaling connection & room registration: PASS');
          passedCount++;
          socket.disconnect();
          resolve();
        }
      });

      socket.on('connect_error', (err) => {
        console.error('❌ T10 Socket error:', err.message);
        socket.disconnect();
        resolve();
      });

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 4000);
    });

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log(`\n========================================`);
  console.log(`RESULT: ${passedCount}/${totalTests} Task 6 Tests Passed`);
  console.log(`========================================`);

  if (passedCount === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Give server time if running standalone or start it
runTask6Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
