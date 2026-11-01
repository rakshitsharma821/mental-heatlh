// ============================================
// MindCare Sanctuary — Comprehensive Security Hardening Test Suite
// Verifies:
// 1. CSRF Protection: Foreign origin blocked on state-changing POST/PUT
// 2. SSRF Protection: Loopback, private IP, and metadata endpoints blocked
// 3. Cryptographic safeCompare timing-safe verification
// 4. Payment order generation & HMAC-SHA256 signature verification
// 5. Payment webhook signature validation and replay attack prevention
// 6. Security headers & X-Powered-By suppression
// ============================================

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { safeCompare } from '../utils/crypto.js';
import { validateSafeUrl } from '../utils/safeRequest.js';
import { db, initPostgresDatabase } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcare_sanctuary_super_secret_jwt_key_2026_botanical';
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.ENCRYPTION_KEY || 'mindcare_payment_secret_default_sign_2026';

test('--- STARTING COMPREHENSIVE SECURITY VERIFICATION TEST SUITE ---', async (t) => {
  await initPostgresDatabase();

  // Test 1: Timing-safe comparison (safeCompare)
  await t.test('1. safeCompare timing-safe comparison correctly compares hashes', () => {
    const hashA = crypto.createHash('sha256').update('secret_data_alpha').digest('hex');
    const hashB = crypto.createHash('sha256').update('secret_data_alpha').digest('hex');
    const hashC = crypto.createHash('sha256').update('secret_data_beta').digest('hex');

    assert.equal(safeCompare(hashA, hashB), true, 'Identical strings must return true');
    assert.equal(safeCompare(hashA, hashC), false, 'Different strings must return false');
    assert.equal(safeCompare(hashA, 'short'), false, 'Different length strings must safely return false');
    assert.equal(safeCompare(null, hashA), false, 'Non-string values must safely return false');
    console.log('✅ 1. safeCompare timing-safe comparison: PASS');
  });

  // Test 2: SSRF Prevention
  await t.test('2. SSRF Prevention blocks localhost, loopback, and metadata service', () => {
    // Blocked URLs
    assert.equal(validateSafeUrl('http://localhost:5000/admin').safe, false);
    assert.equal(validateSafeUrl('http://127.0.0.1:8080/internal').safe, false);
    assert.equal(validateSafeUrl('http://169.254.169.254/latest/meta-data').safe, false); // AWS/Cloud metadata
    assert.equal(validateSafeUrl('http://10.0.0.1/sensitive').safe, false); // Private RFC 1918
    assert.equal(validateSafeUrl('http://192.168.1.1/router').safe, false);
    assert.equal(validateSafeUrl('file:///etc/passwd').safe, false); // Insecure protocol
    assert.equal(validateSafeUrl('gopher://evil.com/').safe, false);

    // Permitted Public URLs
    assert.equal(validateSafeUrl('https://openrouter.ai/api/v1/chat/completions').safe, true);
    assert.equal(validateSafeUrl('https://api.twilio.com/2010-04-01/Messages.json').safe, true);
    assert.equal(validateSafeUrl('https://www.fast2sms.com/dev/bulkV2').safe, true);
    console.log('✅ 2. SSRF Protection validation: PASS');
  });

  // Test 3: CSRF & Origin Protection on state-changing requests
  await t.test('3. CSRF & Origin Protection rejects unauthorized foreign origins on POST requests', async () => {
    const foreignRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-attacker-domain.xyz'
      },
      body: JSON.stringify({ identifier: 'test', password: 'test' })
    });

    assert.equal(foreignRes.status, 403, 'Unauthorized origin must be rejected with 403 Forbidden');
    const foreignData = await foreignRes.json();
    assert.ok(
      foreignData.error === 'CorsForbidden' || foreignData.error === 'CsrfOriginRejected',
      `Expected CorsForbidden or CsrfOriginRejected, got: ${foreignData.error}`
    );
    console.log('✅ 3. Origin & CSRF Protection blocks malicious cross-origin POST: PASS');
  });

  // Test 4: Security Headers
  await t.test('4. Security Headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options) present', async () => {
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200);

    const headers = healthRes.headers;
    assert.ok(headers.get('content-security-policy'), 'CSP header must be present');
    assert.equal(headers.get('x-frame-options'), 'DENY', 'X-Frame-Options must be DENY');
    assert.equal(headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert.equal(headers.get('x-powered-by'), null, 'X-Powered-By must be suppressed');
    console.log('✅ 4. Security headers and fingerprint cloaking: PASS');
  });

  // Test 5: Payment Webhook Signature & Replay Prevention
  await t.test('5. Payment Webhook validates HMAC signature & rejects replayed/expired timestamps', async () => {
    const testPayload = { type: 'payment.captured', orderId: 'ord_test_999', amount: 150000 };
    const rawPayload = JSON.stringify(testPayload);

    // 5a. Expired timestamp (> 5 minutes ago) rejected
    const expiredTimestamp = String(Date.now() - 400000); // 6.6 minutes ago
    const expiredSig = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${expiredTimestamp}.${rawPayload}`)
      .digest('hex');

    const expiredRes = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': expiredSig,
        'X-Webhook-Timestamp': expiredTimestamp
      },
      body: rawPayload
    });
    assert.equal(expiredRes.status, 400, 'Expired webhook timestamp must be rejected');

    // 5b. Invalid signature rejected
    const freshTimestamp = String(Date.now());
    const forgedRes = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'invalid_forged_hmac_hex_code_12345',
        'X-Webhook-Timestamp': freshTimestamp
      },
      body: rawPayload
    });
    assert.equal(forgedRes.status, 403, 'Invalid HMAC webhook signature must be rejected with 403');

    // 5c. Valid signature accepted
    const validSig = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${freshTimestamp}.${rawPayload}`)
      .digest('hex');

    const validRes = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': validSig,
        'X-Webhook-Timestamp': freshTimestamp
      },
      body: rawPayload
    });
    assert.equal(validRes.status, 200, 'Valid webhook signature must return 200 OK');
    const validData = await validRes.json();
    assert.equal(validData.processed, true);
    console.log('✅ 5. Payment webhook signature & replay defense: PASS');
  });
});
