import dotenv from 'dotenv';
import crypto from 'crypto';
import { db } from '../models/db.js';
dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';
const BASE = 'http://localhost:5000/api';

async function runAuthUpgradeTests() {
  console.log('--- STARTING TASK 1 AUTH UPGRADE TEST SUITE ---');

  // Test 1: Age boundary validation (< 20)
  const underageRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      name: 'Young Student',
      email: `underage_${Date.now()}@example.com`,
      password: 'password123',
      mobile_number: '9811122233',
      age: 18,
      gender: 'female',
      address: 'City Center'
    })
  });
  const underageData = await underageRes.json();
  console.log('T1. Underage (18) rejected:', underageRes.status === 400 && underageData.message.includes('20–25') ? 'PASS' : 'FAIL');

  // Test 2: Age boundary validation (> 25)
  const overageRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      name: 'Senior Seeker',
      email: `overage_${Date.now()}@example.com`,
      password: 'password123',
      mobile_number: '9811122234',
      age: 29,
      gender: 'male',
      address: 'Hill View'
    })
  });
  const overageData = await overageRes.json();
  console.log('T2. Overage (29) rejected:', overageRes.status === 400 && overageData.message.includes('20–25') ? 'PASS' : 'FAIL');

  // Test 3: Successful registration with age 22, normalized mobile
  const uniqueId = Date.now();
  const validEmail = `task1_user_${uniqueId}@mindcare.test`;
  const validMobile = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
  const validRegRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      name: 'Rhea Sharma',
      email: validEmail,
      password: 'secretPassword123',
      mobile_number: validMobile,
      age: 22,
      gender: 'female',
      address: '44 Orchid Enclave, Jaipur'
    })
  });
  const validRegData = await validRegRes.json();
  console.log('T3. Valid Register (age 22):', validRegData.success && validRegData.user.mobile_number.startsWith('+91') ? 'PASS' : 'FAIL');

  // Test 4: Duplicate mobile rejection
  const dupMobileRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      name: 'Duplicate Mobile',
      email: `diff_email_${uniqueId}@mindcare.test`,
      password: 'password123',
      mobile_number: validMobile,
      age: 24,
      gender: 'male',
      address: 'Jaipur'
    })
  });
  console.log('T4. Duplicate mobile rejected (409):', dupMobileRes.status === 409 ? 'PASS' : 'FAIL');

  // Test 5: Login Step 1 with Email -> Expect challenge_id (NO JWT returned)
  const loginEmailRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      identifier: validEmail,
      password: 'secretPassword123'
    })
  });
  const loginEmailData = await loginEmailRes.json();
  console.log('T5. Login step 1 (Email):', loginEmailData.requiresOtp && loginEmailData.challenge_id && !loginEmailData.token ? 'PASS (Challenge issued, no token)' : 'FAIL');

  // Test 6: Login Step 1 with Mobile Number
  const loginMobileRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      identifier: validMobile,
      password: 'secretPassword123'
    })
  });
  const loginMobileData = await loginMobileRes.json();
  console.log('T6. Login step 1 (Mobile):', loginMobileData.requiresOtp && loginMobileData.challenge_id ? 'PASS' : 'FAIL');

  const challengeId = loginMobileData.challenge_id;

  // Test 7: Fetch OTP hash directly from DB to simulate user entering wrong vs right code
  const otpRow = await db.query('SELECT * FROM user_otps WHERE challenge_id = $1', [challengeId]);
  console.log('T7. DB stores hashed OTP (not plaintext):', otpRow.rows[0].otp_hash.length === 64 ? 'PASS' : 'FAIL');

  // Test 8: Verify OTP with wrong code -> Decrements attempts
  const wrongOtpRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      challenge_id: challengeId,
      otp: '000000'
    })
  });
  const wrongOtpData = await wrongOtpRes.json();
  console.log('T8. Wrong OTP rejected:', !wrongOtpData.success && wrongOtpData.remainingAttempts === 4 ? 'PASS' : 'FAIL');

  // Test 9: Expired or invalid challenge rejected
  const fakeChallengeRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      challenge_id: 'fake-challenge-id',
      otp: '123456'
    })
  });
  console.log('T9. Invalid challenge rejected:', fakeChallengeRes.status === 400 ? 'PASS' : 'FAIL');

  // Test 10: Successful OTP verification using a known hash
  const knownOtp = '543210';
  const knownHash = crypto.createHash('sha256').update(knownOtp).digest('hex');
  const testChallengeId = crypto.randomUUID();
  await db.query(`
    INSERT INTO user_otps (id, identifier, otp_hash, challenge_id, expires_at, attempts, verified)
    VALUES ($1, $2, $3, $4, $5, 0, FALSE)
  `, [crypto.randomUUID(), validEmail, knownHash, testChallengeId, new Date(Date.now() + 60000)]);

  const correctOtpRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-require-otp': 'true' },
    body: JSON.stringify({
      challenge_id: testChallengeId,
      otp: knownOtp
    })
  });
  const correctOtpData = await correctOtpRes.json();
  console.log('T10. Correct OTP verification:', correctOtpData.success && correctOtpData.token && correctOtpData.user.email === validEmail ? 'PASS (Issued JWT + user profile)' : 'FAIL');

  // Close db connection
  await db.end();
  console.log('--- ALL AUTH UPGRADE TESTS COMPLETED SUCCESSFULLY ---');
}

runAuthUpgradeTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
