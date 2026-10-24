// ============================================
// MindCare Test Suite — Part 1: Entry Flow, Three Logins & Recovery
// ============================================

import http from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { AUTH_MESSAGES } from '../config/constants.js';

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

async function runPart1Tests() {
  console.log('--- STARTING PART 1 ENTRY FLOW, THREE LOGINS & RECOVERY TESTS ---');
  let passed = 0;
  const total = 10;

  try {
    const rand = Math.floor(1000 + Math.random() * 9000);

    // 1. Client signup enforces age (20-25) and generates MC-XXXXXX User ID
    const underAgeRes = await request('POST', '/api/auth/register', {
      email: `client_${rand}@mindcare.test`,
      password: 'Password123!',
      name: 'Client Underage',
      age: 19,
      gender: 'Female',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    const validClientRes = await request('POST', '/api/auth/register', {
      email: `client_${rand}@mindcare.test`,
      password: 'Password123!',
      name: 'Client Valid',
      age: 22,
      gender: 'Female',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    const clientId = validClientRes.body?.user?.public_id;
    if (underAgeRes.status === 400 && validClientRes.status === 201 && clientId?.startsWith('MC-')) {
      console.log('✅ T1. Client registration enforces age (20-25) & assigns MC-XXXXXX User ID: PASS');
      passed++;
    } else {
      console.error('❌ T1 FAIL:', underAgeRes.status, validClientRes.status, clientId);
    }

    // 2. Client Login using User ID (MC-XXXXXX) instead of email
    const loginWithIdRes = await request('POST', '/api/auth/login', {
      portal: 'member',
      identifier: clientId,
      password: 'Password123!'
    });

    if (loginWithIdRes.status === 200 && loginWithIdRes.body.token && loginWithIdRes.body.user.public_id === clientId) {
      console.log('✅ T2. Client logs in with Sanctuary User ID (MC-XXXXXX) & receives direct JWT: PASS');
      passed++;
    } else {
      console.error('❌ T2 FAIL:', loginWithIdRes.status, loginWithIdRes.body);
    }

    // 3. Therapist Registration assigns THR-XXXXXX Therapist ID & creates unapproved profile
    const therapistEmail = `therapist_${rand}@mindcare.test`;
    const regTherapistRes = await request('POST', '/api/auth/register-therapist', {
      name: 'Dr. Evelyn Hope, PsyD',
      email: therapistEmail,
      password: 'TherapistPass123!',
      title: 'Senior Clinical Psychologist',
      license_number: `RCI-PSY-${rand}`,
      licensing_board: 'Rehabilitation Council of India',
      specialties: ['CBT', 'Somatic Regulation'],
      city: 'Bengaluru',
      state: 'Karnataka'
    });

    const assignedTherapistId = regTherapistRes.body?.therapistId;
    if (regTherapistRes.status === 201 && assignedTherapistId?.startsWith('THR-') && regTherapistRes.body.user.role === 'therapist') {
      console.log('✅ T3. Therapist registers with THR-XXXXXX Therapist ID queued under review: PASS');
      passed++;
    } else {
      console.error('❌ T3 FAIL:', regTherapistRes.status, regTherapistRes.body);
    }

    // 4. Therapist Login requires matching Therapist ID + Email + Password
    const therapistWrongIdLogin = await request('POST', '/api/auth/login', {
      portal: 'therapist',
      therapistId: 'THR-WRONGID',
      email: therapistEmail,
      password: 'TherapistPass123!'
    });

    const therapistValidLogin = await request('POST', '/api/auth/login', {
      portal: 'therapist',
      therapistId: assignedTherapistId,
      email: therapistEmail,
      password: 'TherapistPass123!'
    });

    if (therapistWrongIdLogin.status === 401 && therapistValidLogin.status === 200 && therapistValidLogin.body.user.role === 'therapist') {
      console.log('✅ T4. Therapist login strictly requires matching Therapist ID + Email + Password: PASS');
      passed++;
    } else {
      console.error('❌ T4 FAIL: Wrong ID status:', therapistWrongIdLogin.status, 'Valid status:', therapistValidLogin.status);
    }

    // 5. Admin Login requires Admin ID + Password + Confidential Access Code
    // First, let's provision an admin through Super Admin
    await db.query(`
      INSERT INTO users (id, public_id, email, password_hash, salt, recovery_key_hash, full_name, role, status)
      VALUES ('super_admin_test_root', 'ADM-ROOT', 'root@mindcare.test', 'h', 's', 'r', 'Root Admin', 'super_admin', 'active')
      ON CONFLICT (id) DO NOTHING;
    `);
    const superAdminToken = jwt.sign({ id: 'super_admin_test_root', role: 'super_admin' }, JWT_SECRET);
    const newAdminEmail = `admin_part1_${rand}@mindcare.test`;
    const provAdminRes = await request('POST', '/api/admin/create-admin', {
      email: newAdminEmail,
      name: 'Test Administrator',
      reason: 'Part 1 Admin Verification'
    }, superAdminToken);

    const createdAdminId = provAdminRes.body?.user?.public_id;
    const tempPassword = provAdminRes.body?.temporaryPassword;
    const oneTimeCode = provAdminRes.body?.oneTimeAccessCode;

    const adminWrongCode = await request('POST', '/api/auth/login', {
      portal: 'admin',
      adminId: createdAdminId,
      password: tempPassword,
      accessCode: 'ADM-CODE-WRONG'
    });

    const adminSuccess = await request('POST', '/api/auth/login', {
      portal: 'admin',
      adminId: createdAdminId,
      password: tempPassword,
      accessCode: oneTimeCode
    });

    if (adminWrongCode.status === 401 && adminSuccess.status === 200 && adminSuccess.body.token && adminSuccess.body.user.role === 'admin') {
      console.log('✅ T5. Admin login requires Admin ID + Password + Salted Access Code: PASS');
      passed++;
    } else {
      console.error('❌ T5 FAIL: Wrong code:', adminWrongCode.status, 'Success:', adminSuccess.status);
    }

    // 6. Generic error message returned on invalid portal credentials (no information leakage)
    const genericMsgMatch = (adminWrongCode.body.message === AUTH_MESSAGES.GENERIC_ERROR) && (therapistWrongIdLogin.body.message === AUTH_MESSAGES.GENERIC_ERROR);
    if (genericMsgMatch) {
      console.log('✅ T6. Portal returns identical generic error ("These details don\'t match. Please try again."): PASS');
      passed++;
    } else {
      console.error('❌ T6 FAIL: Messages did not match generic constant:', adminWrongCode.body.message);
    }

    // 7. Client self-service password recovery via Email OTP
    const clientReqOtp = await request('POST', '/api/auth/recovery/request-otp', {
      email: `client_${rand}@mindcare.test`,
      role: 'client'
    });

    const clientChallengeId = clientReqOtp.body?.challenge_id;
    const clientOtpRow = await db.query('SELECT otp_hash FROM user_otps WHERE challenge_id = $1', [clientChallengeId]);

    // Complete recovery with verified OTP
    await db.query('UPDATE user_otps SET verified = TRUE WHERE challenge_id = $1', [clientChallengeId]);

    const completeClientRecovery = await request('POST', '/api/auth/recovery/complete', {
      challenge_id: clientChallengeId,
      newPassword: 'NewClientPassword456!'
    });

    const loginWithNewPass = await request('POST', '/api/auth/login', {
      portal: 'member',
      identifier: `client_${rand}@mindcare.test`,
      password: 'NewClientPassword456!'
    });

    if (clientReqOtp.status === 200 && completeClientRecovery.status === 200 && loginWithNewPass.status === 200) {
      console.log('✅ T7. Client self-service password reset via Email OTP: PASS');
      passed++;
    } else {
      console.error('❌ T7 FAIL: client recovery:', completeClientRecovery.body, 'new login:', loginWithNewPass.status);
    }

    // 8. Therapist recovery: view Therapist ID and rotate to new Therapist ID
    const therapistReqOtp = await request('POST', '/api/auth/recovery/request-otp', {
      email: therapistEmail,
      role: 'therapist'
    });

    const therapistChallengeId = therapistReqOtp.body?.challenge_id;
    await db.query('UPDATE user_otps SET verified = TRUE WHERE challenge_id = $1', [therapistChallengeId]);

    const newRotatedId = `THR-${rand}NEW`;
    const completeTherapistRecovery = await request('POST', '/api/auth/recovery/complete', {
      challenge_id: therapistChallengeId,
      newTherapistId: newRotatedId,
      newPassword: 'NewTherapistPass789!'
    });

    const loginWithRotatedId = await request('POST', '/api/auth/login', {
      portal: 'therapist',
      therapistId: newRotatedId,
      email: therapistEmail,
      password: 'NewTherapistPass789!'
    });

    if (completeTherapistRecovery.status === 200 && loginWithRotatedId.status === 200) {
      console.log('✅ T8. Therapist recovers & rotates Therapist ID + resets password via OTP: PASS');
      passed++;
    } else {
      console.error('❌ T8 FAIL: Therapist rotated login:', loginWithRotatedId.status, loginWithRotatedId.body);
    }

    // 9. Admin self-service recovery is strictly forbidden (403)
    const adminRecoveryAttempt = await request('POST', '/api/auth/recovery/request-otp', {
      email: newAdminEmail,
      role: 'admin'
    });

    if (adminRecoveryAttempt.status === 403 && adminRecoveryAttempt.body.message.includes('disabled for administrator')) {
      console.log('✅ T9. Admin self-service recovery rejected (403: Super Admin only): PASS');
      passed++;
    } else {
      console.error('❌ T9 FAIL:', adminRecoveryAttempt.status, adminRecoveryAttempt.body);
    }

    // 10. Super Admin resets administrator credentials & logs audit trail
    const adminDbRecord = await db.query('SELECT id FROM users WHERE email = $1', [newAdminEmail]);
    const targetAdminUserId = adminDbRecord.rows[0]?.id;

    const resetAdminRes = await request('POST', `/api/admin/users/${targetAdminUserId}/reset-credentials`, {}, superAdminToken);
    const auditRes = await db.query("SELECT action FROM admin_audit_log WHERE action = 'reset_admin_credentials' AND target_id = $1", [targetAdminUserId]);

    if (resetAdminRes.status === 200 && resetAdminRes.body.oneTimeAccessCode && auditRes.rows.length > 0) {
      console.log('✅ T10. Super Admin resets admin credentials with one-time access code & audit logged: PASS');
      passed++;
    } else {
      console.error('❌ T10 FAIL:', resetAdminRes.status, 'Audit count:', auditRes.rows.length);
    }

  } catch (err) {
    console.error('Part 1 test execution error:', err);
  }

  console.log(`\n========================================`);
  console.log(`RESULT: ${passed}/${total} Part 1 Tests Passed`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPart1Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
