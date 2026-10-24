import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE = 'http://localhost:5000/api';

async function runPhaseATests() {
  console.log('--- STARTING PHASE A INTEGRATION TESTS ---');

  // 1. Unauthenticated request to /api/companion/chat must be rejected (401)
  try {
    const unauthChat = await fetch(`${BASE}/companion/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    console.log('T11. Unauthenticated chat rejected with 401:', unauthChat.status === 401 ? 'PASS' : 'FAIL');
  } catch (err) {
    console.log('T11. Server might not be running live right now, skipping network call:', err.message);
  }

  // 2. Unauthenticated request to /api/assessment/welcome-message must be rejected (401)
  try {
    const unauthWelcome = await fetch(`${BASE}/assessment/welcome-message`);
    console.log('T12. Unauthenticated welcome-message rejected with 401:', unauthWelcome.status === 401 ? 'PASS' : 'FAIL');
  } catch (err) {
    console.log('T12. Server check skipped:', err.message);
  }

  console.log('--- PHASE A INTEGRATION SUITE FINISHED ---');
}

runPhaseATests();
